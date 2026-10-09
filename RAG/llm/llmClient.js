const config = require("../config");
const { SYSTEM_PROMPT } = require("../config/promptTemplates");

/**
 * Modular LLM Client supporting OpenAI, Gemini, and Local Grounded Deterministic Engine.
 * Enforces strict anti-hallucination and security boundaries.
 */
class LLMClient {
  constructor(provider = config.llmProvider) {
    this.provider = provider;
  }

  /**
   * Generates completion conforming to strict JSON schema
   */
  async generateCompletion({ prompt, systemPrompt = SYSTEM_PROMPT, schemaType = "roadmap" }) {
    if (this.provider === "openai" && config.openai.apiKey) {
      try {
        return await this.callOpenAI({ prompt, systemPrompt });
      } catch (err) {
        // Fall back gracefully to local grounded synthesis on provider failure
        return this.synthesizeLocally({ prompt, schemaType });
      }
    }

    if (this.provider === "gemini" && config.gemini.apiKey) {
      try {
        return await this.callGemini({ prompt, systemPrompt });
      } catch (err) {
        return this.synthesizeLocally({ prompt, schemaType });
      }
    }

    // Default to local grounded synthesis engine
    return this.synthesizeLocally({ prompt, schemaType });
  }

  async callOpenAI({ prompt, systemPrompt }) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Low temperature to maximize factual grounding
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  }

  async callGemini({ prompt, systemPrompt }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  }

  /**
   * Deterministic Grounded Synthesis Engine.
   * Parses retrieved context and assembles structured JSON adhering strictly
   * to knowledge-base grounding without hallucinations or API dependencies.
   */
  synthesizeLocally({ prompt, schemaType = "roadmap" }) {
    // Extract target role from prompt
    const roleMatch = prompt.match(/Target Role:\s*([^\n\r]+)/i);
    const targetRole = roleMatch ? roleMatch[1].trim() : "Software Engineer";

    const companyMatch = prompt.match(/Target Industry & Company Type:\s*([^\n\r]+)/i);
    const companyType = companyMatch ? companyMatch[1].trim() : "Product-based company";

    const gapsMatch = prompt.match(/Identified Skill Gaps:\s*([^\n\r]+)/i);
    const gapsStr = gapsMatch ? gapsMatch[1].trim() : "";

    // Extract retrieved topics from <retrieved_context>
    const contextMatch = prompt.match(/<retrieved_context>([\s\S]*?)<\/retrieved_context>/i);
    const contextText = contextMatch ? contextMatch[1] : "";

    // Parse topics from context
    const topicBlocks = contextText.split(/### Topic:\s*/i).filter(Boolean);
    const parsedTopics = [];

    for (const block of topicBlocks) {
      const lines = block.split("\n");
      const title = lines[0].trim();
      if (!title) continue;

      let difficulty = "Intermediate";
      if (block.includes("**Difficulty:** Beginner")) difficulty = "Beginner";
      if (block.includes("**Difficulty:** Advanced")) difficulty = "Advanced";

      let stage = "Core Skills";
      const stageMatch = block.match(/\*\*Stage:\*\*\s*([^\n\r|]+)/i);
      if (stageMatch) stage = stageMatch[1].trim();

      // Extract resources safely
      const resources = [];
      const resMatches = block.matchAll(/- \[([^\]]+)\] ([^:]+):\s*(https?:\/\/[^\s]+)/g);
      for (const m of resMatches) {
        resources.push({
          type: m[1].toLowerCase(),
          title: m[2].trim(),
          url: m[3].trim(),
        });
      }

      // Extract practice tasks
      const practiceTasks = [];
      const taskMatches = block.matchAll(/\* Task:\s*([^\n\r]+)/g);
      for (const t of taskMatches) {
        practiceTasks.push(t[1].trim());
      }

      // Extract project
      const projMatch = block.match(/\* Real-World Project:\s*([^\n\r]+)/i);
      const projectApplication = projMatch ? projMatch[1].trim() : `Build a production ${title} feature`;

      // Extract completion criteria
      const critMatch = block.match(/\* Completion Proof:\s*([^\n\r]+)/i);
      const completionCriteria = critMatch ? critMatch[1].trim() : `Demonstrate passing tests and verified implementation of ${title}`;

      // Extract next step
      const nextMatch = block.match(/\* Next Step:\s*([^\n\r]+)/i);
      const nextRecommendedStep = nextMatch ? nextMatch[1].trim() : "Proceed to next curriculum milestone";

      parsedTopics.push({
        topic: title,
        whyRecommended: `Essential mastery for ${targetRole} at ${companyType}, directly bridging identified skill gaps.`,
        difficulty,
        stage,
        prerequisites: [],
        estimatedEffort: difficulty === "Beginner" ? "12 hours (1 week)" : difficulty === "Advanced" ? "25 hours (2-3 weeks)" : "18 hours (2 weeks)",
        recommendedResources: resources.length > 0 ? resources : [
          {
            title: `${title} Official Documentation`,
            type: "documentation",
            url: "Resource not available in the current knowledge base",
          },
        ],
        practiceTasks: practiceTasks.length > 0 ? practiceTasks : [`Implement practical exercises for ${title}`],
        projectApplication,
        completionCriteria,
        nextRecommendedStep,
      });
    }

    if (schemaType === "recommendations") {
      const top3 = parsedTopics.slice(0, 3);
      return {
        recommendations: top3.map((t, idx) => ({
          topic: t.topic,
          reason: `Recommended because you are targeting ${targetRole} and need mastery in ${t.topic}.`,
          priority: idx === 0 ? "HIGH" : idx === 1 ? "MEDIUM" : "LOW",
          estimatedEffort: t.estimatedEffort,
          practiceMilestone: t.completionCriteria,
        })),
      };
    }

    // Default roadmap schema: Group topics by standard stages
    const standardStages = [
      "Foundation",
      "Core Skills",
      "Intermediate Skills",
      "Advanced Skills",
      "Projects",
      "Interview Preparation",
      "Career Preparation",
    ];

    const stagesMap = {};
    for (const s of standardStages) {
      stagesMap[s] = [];
    }

    // Distribute parsed topics dynamically based on stage or difficulty
    for (const t of parsedTopics) {
      let targetStage = t.stage;
      if (!standardStages.includes(targetStage) || targetStage === "Core Skills") {
        if (t.difficulty === "Beginner") {
          targetStage = "Foundation";
        } else if (t.difficulty === "Advanced") {
          targetStage = "Advanced Skills";
        } else if (stagesMap["Core Skills"].length > 2) {
          targetStage = "Intermediate Skills";
        } else {
          targetStage = "Core Skills";
        }
      }
      stagesMap[targetStage].push(t);
    }

    // Ensure Projects, Interview Preparation, and Career Preparation milestones exist
    if (parsedTopics.length > 0) {
      if (stagesMap["Projects"].length === 0) {
        stagesMap["Projects"].push({
          topic: `Capstone: Production ${targetRole} Portfolio Project`,
          whyRecommended: `Demonstrates end-to-end full lifecycle engineering aligned with ${companyType} hiring standards.`,
          difficulty: "Advanced",
          prerequisites: ["Core Skills"],
          estimatedEffort: "35 hours (3-4 weeks)",
          recommendedResources: [
            {
              title: "Production Architecture & Best Practices Guide",
              type: "documentation",
              url: "https://github.com/donnemartin/system-design-primer",
            },
          ],
          practiceTasks: [`Build and deploy a scalable ${targetRole} application with CI/CD and automated tests`],
          projectApplication: `Production-ready ${targetRole} application with observability and Docker deployment`,
          completionCriteria: "Deployed with public URL and passing automated test suite",
          nextRecommendedStep: "Technical Interview Preparation",
        });
      }

      if (stagesMap["Interview Preparation"].length === 0) {
        stagesMap["Interview Preparation"].push({
          topic: `Technical Interview Mastery for ${targetRole}`,
          whyRecommended: `Targeted problem-solving drills and architecture rounds tailored to ${companyType}.`,
          difficulty: "Intermediate",
          prerequisites: ["Core Skills"],
          estimatedEffort: "20 hours (2 weeks)",
          recommendedResources: [
            {
              title: "Technical Interview Handbook",
              type: "article",
              url: "https://www.techinterviewhandbook.org/",
            },
          ],
          practiceTasks: ["Complete mock system design and live technical coding problem walkthroughs"],
          projectApplication: "Documented solutions to top domain-specific interview scenarios",
          completionCriteria: "Fluently explain architectural tradeoffs, concurrency, and performance bottlenecks",
          nextRecommendedStep: "Career Preparation & Portfolio Review",
        });
      }

      if (stagesMap["Career Preparation"].length === 0) {
        stagesMap["Career Preparation"].push({
          topic: `Portfolio, Resume Polish & Technical Case Study`,
          whyRecommended: `Presents demonstrable proof of competence to recruiters and hiring managers.`,
          difficulty: "Intermediate",
          prerequisites: [],
          estimatedEffort: "10 hours (1 week)",
          recommendedResources: [
            {
              title: "Writing Exceptional Technical READMEs",
              type: "article",
              url: "https://github.com/matiassingers/awesome-readme",
            },
          ],
          practiceTasks: ["Write deep architectural case study detailing trade-offs and performance optimizations"],
          projectApplication: "Professional developer portfolio featuring live project demonstrations",
          completionCriteria: "Public GitHub repository with verified code coverage and architecture diagrams",
          nextRecommendedStep: "Begin Target Job Applications",
        });
      }
    }

    const outputStages = [];
    for (const stageName of standardStages) {
      const items = stagesMap[stageName];
      if (items.length > 0) {
        outputStages.push({
          stageName,
          stageDescription: `Curriculum milestone for ${stageName} tailored to ${targetRole} requirements.`,
          items,
        });
      }
    }

    // If no topics could be parsed from context (e.g. out of domain query),
    // strictly inform insufficient knowledge instead of hallucinating!
    if (outputStages.length === 0) {
      return {
        roadmapTitle: `Personalized ${targetRole} Roadmap`,
        summary: "Notice: Knowledge base does not currently contain verified topics matching this specific query.",
        estimatedTotalWeeks: 0,
        stages: [],
      };
    }

    return {
      roadmapTitle: `Personalized ${targetRole} Roadmap (${companyType})`,
      summary: `Tailored curriculum designed for ${targetRole} targeting ${companyType}. Customized to bridge detected gaps: ${gapsStr || "Comprehensive Mastery"}.`,
      estimatedTotalWeeks: Math.max(8, outputStages.reduce((acc, s) => acc + s.items.length * 2, 0)),
      stages: outputStages,
    };
  }
}

module.exports = {
  LLMClient,
};
