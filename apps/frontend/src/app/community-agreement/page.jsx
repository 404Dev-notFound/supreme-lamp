"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Shield,
  FileCheck2,
  Users,
  Compass,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";

export default function CommunityAgreementPage() {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Fillable form state
  const [formData, setFormData] = useState({
    projectName: "",
    repoUrl: "",
    projectLead: "",
    offlineHub: "",
    executionDate: new Date().toISOString().split("T")[0],
    projectType: "open-source",
    leadRole: "Lead Architect / Maintainer",
    leadContact: "",
    leadGithub: "",
    contributor1Name: "",
    contributor1Role: "",
    contributor1Contact: "",
    contributor1Github: "",
    contributor2Name: "",
    contributor2Role: "",
    contributor2Contact: "",
    contributor2Github: "",
    contributor3Name: "",
    contributor3Role: "",
    contributor3Contact: "",
    contributor3Github: "",
    mentorName: "",
    mentorHub: "",
  });

  const [additionalContributors, setAdditionalContributors] = useState([
    { name: "", role: "", github: "", dateJoined: "", approved: false },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addContributorRow = () => {
    setAdditionalContributors((prev) => [
      ...prev,
      { name: "", role: "", github: "", dateJoined: "", approved: false },
    ]);
  };

  const updateAdditionalContributor = (index, field, value) => {
    setAdditionalContributors((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const markdownContent = `# 404 AGREEMENT FORM
## Offline Community Project Collaboration Agreement
### 404 Community — From Error to Execution

Project Name: ${formData.projectName || "[Project Name]"}
Repository: ${formData.repoUrl || "[Repo Link]"}
Project Lead: ${formData.projectLead || "[Lead Name]"}
Offline Chapter / Hub: ${formData.offlineHub || "[Campus / Hub]"}
Date: ${formData.executionDate || "[Execution Date]"}
Type: ${formData.projectType === "open-source" ? "Open Source" : "Private / Stealth"}

1. Agreement Details
2. Purpose of Agreement
3. Role of 404 Community
4. Project Ownership
5. Contribution and Credit
6. Mandatory 404 Community Attribution
7. Repository and Access
8. Open Source / Private Project
9. AI and Third-Party Resources
10. Confidentiality
11. Public Presentation and Portfolio Use
12. Commercialization and Revenue
13. Project Abandonment
14. Leaving the Project
15. Disagreements and Resolution
16. Academic and College Rules
17. Changes to Agreement
18. No Misrepresentation
19. Acknowledgement
20. Signatures
21. Additional Contributors

Official document from 404 Community — From Error to Execution.
`;
    navigator.clipboard.writeText(markdownContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    if (confirm("Reset all agreement form fields?")) {
      setFormData({
        projectName: "",
        repoUrl: "",
        projectLead: "",
        offlineHub: "",
        executionDate: new Date().toISOString().split("T")[0],
        projectType: "open-source",
        leadRole: "Lead Architect / Maintainer",
        leadContact: "",
        leadGithub: "",
        contributor1Name: "",
        contributor1Role: "",
        contributor1Contact: "",
        contributor1Github: "",
        contributor2Name: "",
        contributor2Role: "",
        contributor2Contact: "",
        contributor2Github: "",
        contributor3Name: "",
        contributor3Role: "",
        contributor3Contact: "",
        contributor3Github: "",
        mentorName: "",
        mentorHub: "",
      });
      setAcknowledged(false);
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-amber-500/30">
      {/* Navigation (Hidden during print) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10 print:hidden">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white hidden sm:inline">
              flowCTRL
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/roadmaps"
            className="text-xs text-zinc-300 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            Roadmaps
          </Link>
          <NavProfile />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 space-y-10 print:pt-4 print:pb-4 print:px-0">
        {/* Top Header Card */}
        <div className="space-y-4 text-center sm:text-left border-b border-white/10 pb-8 print:border-black/20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Official Offline Community Agreement
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white print:text-black">
                404 Agreement Form
              </h1>
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 mt-1 print:text-zinc-800">
                404 Community — From Error to Execution
              </p>
              <p className="text-xs text-zinc-400 mt-1 print:text-zinc-600">
                Standard Offline Project Collaboration &amp; Intellectual Attribution Form
              </p>
            </div>

            {/* Quick Action Buttons (hidden in print) */}
            <div className="flex items-center gap-2 print:hidden self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-zinc-100 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-zinc-100 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Copy markdown text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Reset fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Separation Notice Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-left text-xs leading-relaxed text-amber-200/90 print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-300 print:text-zinc-900 block mb-0.5">
                Dedicated Community Governance Notice:
              </strong>
              This agreement is specifically formulated for the{" "}
              <strong>offline 404 Community</strong> and its offline project
              cohorts. It remains completely separate from FlowCTRL’s own Terms &amp;
              Conditions and software privacy policies.
            </div>
          </div>
        </div>

        {/* 1. Agreement Details Form Section */}
        <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl space-y-6 print:border-zinc-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 print:border-zinc-200">
            <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h2 className="text-lg font-bold text-white print:text-black">
              Agreement Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Community Organization
              </label>
              <input
                type="text"
                readOnly
                value="404 Community — From Error to Execution"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-300 font-semibold focus:outline-none print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Project Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                placeholder="e.g., CodeSync, FlowEngine, HackTracker"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 transition-colors print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Project Lead / Initiator
              </label>
              <input
                type="text"
                name="projectLead"
                value={formData.projectLead}
                onChange={handleInputChange}
                placeholder="Full name of project lead"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 transition-colors print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Offline Campus / Hub / Chapter
              </label>
              <input
                type="text"
                name="offlineHub"
                value={formData.offlineHub}
                onChange={handleInputChange}
                placeholder="e.g., Campus Lab 4, Tech Innovation Hub"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 transition-colors print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Repository Link / Organization
              </label>
              <input
                type="text"
                name="repoUrl"
                value={formData.repoUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/organization/project"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 transition-colors print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Date of Execution / Effective Date
              </label>
              <input
                type="date"
                name="executionDate"
                value={formData.executionDate}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400 transition-colors print:border-zinc-300 print:text-black"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-zinc-400 font-medium print:text-zinc-700">
                Project Classification
              </label>
              <div className="flex gap-4 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="projectType"
                    value="open-source"
                    checked={formData.projectType === "open-source"}
                    onChange={handleInputChange}
                    className="accent-amber-400"
                  />
                  <span className="text-zinc-200 print:text-black">
                    Open Source (Public License: MIT / Apache 2.0)
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="projectType"
                    value="private"
                    checked={formData.projectType === "private"}
                    onChange={handleInputChange}
                    className="accent-amber-400"
                  />
                  <span className="text-zinc-200 print:text-black">
                    Private / Stealth Incubation
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Legal & Policy Clauses (Sections 2 to 18) */}
        <div className="space-y-6 text-sm text-zinc-300 print:text-black leading-relaxed">
          {/* 2. Purpose */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                2
              </span>
              Purpose of Agreement
            </h2>
            <p>
              The purpose of this <strong>404 Agreement Form</strong> is to
              establish transparent, structured, and mutually agreed-upon terms
              for student developers, engineers, and designers collaborating on
              offline initiatives under the banner, guidance, or mentorship of
              the <strong>404 Community</strong>. This agreement governs
              intellectual property rights, contribution credits, repository
              access, code stewardship, and conflict management to ensure a
              healthy and productive collaborative environment.
            </p>
          </section>

          {/* 3. Role of 404 Community */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                3
              </span>
              Role of 404 Community
            </h2>
            <p>
              The <strong>404 Community</strong> (
              <em>&quot;From Error to Execution&quot;</em>) serves as a peer-driven
              offline technical catalyst, workspace facilitator, and incubation
              guild. The Community provides mentorship, technical guidance, peer
              review, and offline meeting environments. The 404 Community does{" "}
              <strong>not</strong> assert commercial ownership, copyright, or
              equity over projects built by members unless a separate written
              incubation contract is explicitly entered into by all contributors.
            </p>
          </section>

          {/* 4. Project Ownership */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                4
              </span>
              Project Ownership
            </h2>
            <p>
              Unless specified otherwise in a unanimous written addendum, all
              source code, design assets, and architecture created during the
              project belong collectively to the active contributors in proportion
              to their recorded contributions. No single member, including the
              Project Lead, may unilaterally sell, relicense, or assign the
              project to third parties without the unanimous written consent of
              all active contributors.
            </p>
          </section>

          {/* 5. Contribution and Credit */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                5
              </span>
              Contribution and Credit
            </h2>
            <p>
              Every participating contributor is entitled to explicit, public
              credit for their individual contributions (including architecture,
              frontend, backend, testing, design, and documentation). Teams must
              maintain an accurate <code>CONTRIBUTORS.md</code> file in the
              root of the repository. Deliberately removing, obscuring, or
              falsifying contribution credits is considered a severe violation of
              community ethics and this agreement.
            </p>
          </section>

          {/* 6. Mandatory 404 Community Attribution */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                6
              </span>
              Mandatory 404 Community Attribution
            </h2>
            <p>
              To maintain the integrity and mutual support of the community, all
              projects initiated, incubated, or developed within the offline 404
              Community must prominently display:
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-amber-300 print:border-zinc-300 print:bg-zinc-100 print:text-black">
              &quot;Proudly incubated within 404 Community — From Error to Execution&quot;
            </div>
            <p className="text-xs text-zinc-400 print:text-zinc-600">
              This attribution must be included in the repository README, public
              demo footer, and official project documentation.
            </p>
          </section>

          {/* 7. Repository and Access */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                7
              </span>
              Repository and Access
            </h2>
            <p>
              Code must be maintained in an approved version control repository
              (GitHub or GitLab). All core contributors must be granted appropriate
              collaborator or maintainer privileges. A strict zero-lockout policy
              applies: no contributor may be arbitrarily removed or locked out of
              the repository without following the formal dispute protocol
              (Section 15).
            </p>
          </section>

          {/* 8. Open Source / Private Project */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                8
              </span>
              Open Source / Private Project
            </h2>
            <p>
              The team shall declare the project licensing status in Section 1.
              Open-source projects must adopt a recognized OSI-compliant license
              (e.g., MIT, Apache 2.0). Transitioning a private project to open
              source (or vice versa) requires supermajority consent (at least
              75%) of all active contributors.
            </p>
          </section>

          {/* 9. AI and Third-Party Resources */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                9
              </span>
              AI and Third-Party Resources
            </h2>
            <p>
              Use of AI developer assistants (LLMs, code generation agents) is
              permitted. All third-party libraries, packages, and frameworks must
              comply with their respective upstream open-source licenses.
              Contributors must never commit proprietary, leaked, or infringing
              third-party code into the project repository.
            </p>
          </section>

          {/* 10. Confidentiality */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                10
              </span>
              Confidentiality
            </h2>
            <p>
              If designated as Private/Stealth, team members agree to protect
              unreleased code, architectural diagrams, API keys, and client data.
              Internal offline community discussions, member contact details, and
              private strategy meetings shall remain strictly confidential.
            </p>
          </section>

          {/* 11. Public Presentation and Portfolio Use */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                11
              </span>
              Public Presentation and Portfolio Use
            </h2>
            <p>
              All contributors retain the right to showcase their specific work,
              screenshots, code samples, and demo videos in their personal
              portfolios, resumes, and LinkedIn profiles. Contributor roles must
              be described truthfully and accurately, without claiming sole
              authorship over collaborative group efforts.
            </p>
          </section>

          {/* 12. Commercialization and Revenue */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                12
              </span>
              Commercialization and Revenue
            </h2>
            <p>
              If the project transitions to a commercial entity, monetized SaaS,
              or venture spin-off, contributors must execute a formal, written
              Commercialization Addendum determining equity or profit-sharing
              before accepting external funds. The 404 Community takes 0% equity
              by default, focusing entirely on educational and technical growth.
            </p>
          </section>

          {/* 13. Project Abandonment */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                13
              </span>
              Project Abandonment
            </h2>
            <p>
              A project is deemed abandoned if no substantive commits or team
              communication occurs for 60 consecutive days, and the Project Lead
              fails to respond within 14 days. In such cases, remaining active
              contributors or 404 Community mentors may archive, steward, or
              open-source the project for the benefit of subsequent cohorts while
              maintaining historical contributor attribution.
            </p>
          </section>

          {/* 14. Leaving the Project */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                14
              </span>
              Leaving the Project
            </h2>
            <p>
              Any member may withdraw from the project by giving 14 days&apos; written
              notice. Departing members must push all outstanding work, return or
              transfer shared credentials, and conduct a brief handover. Past
              attribution remains intact, while future decision-making rights on
              subsequent milestones are relinquished.
            </p>
          </section>

          {/* 15. Disagreements and Resolution */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                15
              </span>
              Disagreements and Resolution
            </h2>
            <p>
              Disputes shall first be addressed through direct peer-to-peer
              dialogue. If unresolved within 7 days, the dispute shall be
              referred to the 404 Community Lead Mentors or Chapter Advisory
              Board for neutral mediation. Resolutions shall prioritize team
              harmony, fairness, and project preservation.
            </p>
          </section>

          {/* 16. Academic and College Rules */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                16
              </span>
              Academic and College Rules
            </h2>
            <p>
              When a project overlaps with college coursework, hackathons, or
              capstone evaluations, all members must comply with institutional
              academic honesty policies. Academic constraints imposed on one
              student must not compromise the open-source license or portfolio
              rights of other community members.
            </p>
          </section>

          {/* 17. Changes to Agreement */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                17
              </span>
              Changes to Agreement
            </h2>
            <p>
              Amendments to this Agreement require the unanimous written
              consent of all active contributors and countersignature by a 404
              Community Mentor. Any updated version shall be committed to the
              project repository.
            </p>
          </section>

          {/* 18. No Misrepresentation */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-3 print:border-zinc-300 print:bg-white">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/10 text-amber-300 flex items-center justify-center text-xs">
                18
              </span>
              No Misrepresentation
            </h2>
            <p>
              Members agree to uphold honesty, peer respect, and community
              standards. Fabricating contributions, plagiarizing code, harassing
              peers, or defaming the 404 Community or fellow members will lead to
              immediate revocation of community affiliation and formal removal
              from the project.
            </p>
          </section>

          {/* 19. Acknowledgement */}
          <section className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4 print:border-zinc-300 print:bg-zinc-50">
            <h2 className="text-base font-bold text-amber-300 print:text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
                19
              </span>
              Acknowledgement
            </h2>
            <p className="text-xs text-amber-200/90 print:text-zinc-800">
              By signing below or confirming participation, each contributor
              affirms that they have read, understood, and agreed to all 19
              clauses of this 404 Agreement Form, upholding the ethos of{" "}
              <strong>404 Community — From Error to Execution</strong>.
            </p>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 cursor-pointer print:border-zinc-300 print:bg-white">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <span className="text-xs font-semibold text-zinc-200 print:text-black">
                I hereby acknowledge and agree to uphold all provisions of this
                404 Agreement Form.
              </span>
            </label>
          </section>

          {/* 20. Signatures */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-6 print:border-zinc-300 print:bg-white">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 print:border-zinc-200">
              <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                20
              </span>
              <h2 className="text-lg font-bold text-white print:text-black">
                Signatures &amp; Execution
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Project Lead */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 print:border-zinc-300 print:bg-zinc-50">
                <div className="font-bold text-amber-300 print:text-black uppercase tracking-wider text-[11px]">
                  Project Lead / Maintainer
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Full Name</label>
                  <input
                    type="text"
                    name="projectLead"
                    value={formData.projectLead}
                    onChange={handleInputChange}
                    placeholder="Project Lead Name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">GitHub / Email</label>
                  <input
                    type="text"
                    name="leadContact"
                    value={formData.leadContact}
                    onChange={handleInputChange}
                    placeholder="lead@example.com / @username"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="pt-3 border-t border-white/10 print:border-zinc-300">
                  <div className="h-10 border-b border-dashed border-zinc-600 mb-1 flex items-end">
                    <span className="text-[11px] text-zinc-500 italic">
                      Physical or Digital Signature
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Signature</span>
                    <span>Date: {formData.executionDate}</span>
                  </div>
                </div>
              </div>

              {/* Core Contributor 1 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 print:border-zinc-300 print:bg-zinc-50">
                <div className="font-bold text-zinc-300 print:text-black uppercase tracking-wider text-[11px]">
                  Core Contributor 1
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Full Name</label>
                  <input
                    type="text"
                    name="contributor1Name"
                    value={formData.contributor1Name}
                    onChange={handleInputChange}
                    placeholder="Contributor Name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Role &amp; GitHub</label>
                  <input
                    type="text"
                    name="contributor1Role"
                    value={formData.contributor1Role}
                    onChange={handleInputChange}
                    placeholder="Frontend / @handle"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="pt-3 border-t border-white/10 print:border-zinc-300">
                  <div className="h-10 border-b border-dashed border-zinc-600 mb-1 flex items-end">
                    <span className="text-[11px] text-zinc-500 italic">
                      Physical or Digital Signature
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Signature</span>
                    <span>Date: ____________</span>
                  </div>
                </div>
              </div>

              {/* Core Contributor 2 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 print:border-zinc-300 print:bg-zinc-50">
                <div className="font-bold text-zinc-300 print:text-black uppercase tracking-wider text-[11px]">
                  Core Contributor 2
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Full Name</label>
                  <input
                    type="text"
                    name="contributor2Name"
                    value={formData.contributor2Name}
                    onChange={handleInputChange}
                    placeholder="Contributor Name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Role &amp; GitHub</label>
                  <input
                    type="text"
                    name="contributor2Role"
                    value={formData.contributor2Role}
                    onChange={handleInputChange}
                    placeholder="Backend / @handle"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="pt-3 border-t border-white/10 print:border-zinc-300">
                  <div className="h-10 border-b border-dashed border-zinc-600 mb-1 flex items-end">
                    <span className="text-[11px] text-zinc-500 italic">
                      Physical or Digital Signature
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Signature</span>
                    <span>Date: ____________</span>
                  </div>
                </div>
              </div>

              {/* 404 Community Mentor Witness */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 print:border-zinc-300 print:bg-zinc-50">
                <div className="font-bold text-orange-400 print:text-black uppercase tracking-wider text-[11px]">
                  404 Community Mentor / Witness
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Mentor Name</label>
                  <input
                    type="text"
                    name="mentorName"
                    value={formData.mentorName}
                    onChange={handleInputChange}
                    placeholder="404 Community Mentor Name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 print:text-zinc-600">Chapter / Campus Hub</label>
                  <input
                    type="text"
                    name="mentorHub"
                    value={formData.mentorHub}
                    onChange={handleInputChange}
                    placeholder="Offline Hub Chapter"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white print:border-zinc-300 print:text-black"
                  />
                </div>
                <div className="pt-3 border-t border-white/10 print:border-zinc-300">
                  <div className="h-10 border-b border-dashed border-zinc-600 mb-1 flex items-end">
                    <span className="text-[11px] text-zinc-500 italic">
                      Witness Endorsement
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Mentor Signature</span>
                    <span>Date: ____________</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 21. Additional Contributors */}
          <section className="p-6 rounded-3xl bg-zinc-950/70 border border-white/10 space-y-4 print:border-zinc-300 print:bg-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 print:border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                  21
                </span>
                <h2 className="text-lg font-bold text-white print:text-black">
                  Additional Contributors Addendum
                </h2>
              </div>

              <button
                type="button"
                onClick={addContributorRow}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white transition-colors cursor-pointer print:hidden"
              >
                + Add Contributor Row
              </button>
            </div>

            <p className="text-xs text-zinc-400 print:text-zinc-600">
              Subsequent contributors joining post-execution are bound by all
              terms upon signing and receiving Project Lead approval.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 print:border-zinc-300 print:text-zinc-700">
                    <th className="py-2 pr-3">Contributor Name</th>
                    <th className="py-2 px-3">Role / Focus</th>
                    <th className="py-2 px-3">GitHub Handle</th>
                    <th className="py-2 px-3">Date Joined</th>
                    <th className="py-2 pl-3">Lead Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-zinc-200">
                  {additionalContributors.map((c, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) =>
                            updateAdditionalContributor(idx, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="w-full bg-transparent border-b border-white/10 py-1 focus:outline-none print:border-zinc-300 print:text-black"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={c.role}
                          onChange={(e) =>
                            updateAdditionalContributor(idx, "role", e.target.value)
                          }
                          placeholder="e.g., UI/UX, Testing"
                          className="w-full bg-transparent border-b border-white/10 py-1 focus:outline-none print:border-zinc-300 print:text-black"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={c.github}
                          onChange={(e) =>
                            updateAdditionalContributor(idx, "github", e.target.value)
                          }
                          placeholder="@username"
                          className="w-full bg-transparent border-b border-white/10 py-1 focus:outline-none print:border-zinc-300 print:text-black"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="date"
                          value={c.dateJoined}
                          onChange={(e) =>
                            updateAdditionalContributor(idx, "dateJoined", e.target.value)
                          }
                          className="bg-transparent border-b border-white/10 py-1 focus:outline-none print:border-zinc-300 print:text-black"
                        />
                      </td>
                      <td className="py-2 pl-3">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={c.approved}
                            onChange={(e) =>
                              updateAdditionalContributor(idx, "approved", e.target.checked)
                            }
                            className="accent-amber-400"
                          />
                          <span className="text-[11px] text-zinc-300 print:text-zinc-700">
                            Approved
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer Attribution Banner within Document */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-zinc-400 print:border-zinc-300 print:text-zinc-600 space-y-1">
          <p className="font-semibold text-zinc-200 print:text-black">
            404 Community — From Error to Execution
          </p>
          <p>Document Standard: 404-AGR-FORM-V1.0 • Offline Collaboration Registry</p>
        </div>
      </main>

      {/* Global Footer (hidden during print) */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
