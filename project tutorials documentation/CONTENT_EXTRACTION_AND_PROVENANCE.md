# Build Your Own X: Content Extraction, Licensing & Future Expansion

## 1. Repository Analysis

The authoritative knowledge source for Project-Building Tutorials is:
`D:\overall\dev\obsidian\projects and it's code\build-your-own-x\`

### Quantitative Findings:
- **Total Categories Discovered**: 31
- **Total Tutorials Cataloged**: 359
- **Programming Languages Covered**: 37 (C, C++, Rust, Go, Python, JavaScript, TypeScript, Java, Kotlin, C#, Ruby, Nim, Zig, Assembly, etc.)
- **License**: **CC0 1.0 Universal (Public Domain Dedication)**
  `https://creativecommons.org/publicdomain/zero/1.0/`
- **Original Author**: Daniel Stefanovic
- **Current Maintainer**: CodeCrafters, Inc. and open-source contributors

---

## 2. Extraction & Taxonomy Rules

To avoid simply duplicating markdown links, `flowCTRL` extracted and elevated the content into structured, interactive engineering modules:

| Rule | Implementation Standard |
|---|---|
| **No Raw Readme Copying** | Tutorials are structured into standard schemas: `whatYouWillBuild`, `whyBuildThis`, `realWorldApplications`, `expectedOutcome`, `learningOutcomes`, and multi-stage `steps`. |
| **Source Provenance** | Every project retains `sourceRepo`, `sourceAuthor`, and `sourceLicense` in PostgreSQL. |
| **Attribution** | Clear attribution badges are displayed on project detail cards and overview footers. |
| **Verified Links** | Original tutorials, GitHub repositories, RFCs, and official specifications are tagged with `isVerified: true`. |
| **No Fabricated Data** | All URLs reference real external repositories and authored articles (Connor Stack, James Smith, Liz Rice, Rodrigo Pombo, Sebastian Raschka, Jeremy Ruten). |

---

## 3. Flagship Curated Projects in Initial Catalog

1. **`build-your-own-sqlite-database`**:
   - Language: C
   - Difficulty: Intermediate
   - Category: Databases & Storage Engines
   - Key Concepts: B-Tree node splitting, paged memory layout (4096-byte pages), SQL tokenizer, bytecode VM, disk flushing with POSIX I/O.
2. **`build-your-own-redis`**:
   - Language: C++ / Go
   - Difficulty: Advanced
   - Category: Databases & Storage Engines
   - Key Concepts: RESP protocol parser, non-blocking sockets with epoll/poll, event loop architecture, progressive hashtable rehashing, TTL tracking.
3. **`build-your-own-git`**:
   - Language: Python / Rust
   - Difficulty: Beginner
   - Category: Developer Tools & Version Control
   - Key Concepts: Content-addressable storage, SHA-1 hashing, zlib compression, blob/tree/commit object format, DAG traversal.
4. **`build-your-own-docker`**:
   - Language: Go / C
   - Difficulty: Advanced
   - Category: Developer Tools & Version Control
   - Key Concepts: Linux namespaces (UTS, PID, Mount), chroot jail, procfs mounting, cgroups v2 resource capping.
5. **`build-your-own-react`**:
   - Language: JavaScript / TypeScript
   - Difficulty: Intermediate
   - Category: Frontend Frameworks & UI Engines
   - Key Concepts: Virtual DOM, createElement, fiber node linked list, concurrent work loop with requestIdleCallback, DOM diffing, useState hook.
6. **`build-your-own-http-server`**:
   - Language: Node.js / C
   - Difficulty: Beginner
   - Category: Web Servers & Networking
   - Key Concepts: Raw TCP socket listener, RFC 7230 request line parsing, header parsing, directory traversal prevention, static MIME streaming.
7. **`build-your-own-llm`**:
   - Language: Python
   - Difficulty: Advanced
   - Category: Artificial Intelligence & Neural Networks
   - Key Concepts: Byte-Pair Encoding (BPE), causal masked self-attention, multi-head projection, LayerNorm & GELU, autoregressive text generation.
8. **`build-your-own-text-editor`**:
   - Language: C
   - Difficulty: Intermediate
   - Category: Systems Programming & Operating Systems
   - Key Concepts: POSIX termios terminal raw mode, VT100 escape sequences, screen buffer allocation, scrolling logic, syntax colorization.

---

## 4. How to Add Future Project Tutorials

The system is architected for zero-code-change catalog expansion:

1. Open `apps/backend/src/seeds/seedProjectTutorials.js`.
2. Add a new object to `tutorialsData` specifying:
   - `slug`: unique URL identifier
   - `title`, `description`, `categorySlug`, `language`, `languages`, `difficulty`, `estimatedHours`
   - `whatYouWillBuild`, `whyBuildThis`, `realWorldApplications`, `expectedOutcome`
   - `prerequisites`, `technologies`, `toolsRequired`, `learningOutcomes`
   - `resources`: array of verified external references
   - `steps`: array of ordered implementation steps with `title`, `objective`, `content`, `codeSnippet`, and `expectedResult`
3. Run the idempotent seeder:
   ```bash
   node apps/backend/src/seeds/seedProjectTutorials.js
   ```
4. The backend automatically clears the Redis catalog cache via `projectTutorialsService.invalidateCatalogCache()`, immediately making the new project searchable and browsable in the frontend.

