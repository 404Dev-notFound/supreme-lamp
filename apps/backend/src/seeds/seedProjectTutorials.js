const { prisma } = require("../lib/prisma");

/**
 * Idempotent seeder for Project-Building Tutorials catalog.
 * Curated from authoritative sources in build-your-own-x under CC0-1.0 license
 * with full source provenance, author attribution, verified URLs,
 * learning outcomes, prerequisites, and multi-stage step-by-step guidance.
 */

const categoriesData = [
  {
    slug: "databases",
    name: "Databases & Storage Engines",
    description: "Build relational engines, in-memory key-value stores, B-Trees, and custom query parsers from first principles.",
    icon: "Database",
    sortOrder: 1,
  },
  {
    slug: "developer-tools",
    name: "Developer Tools & Version Control",
    description: "Construct foundational tools developers rely on daily: version control systems, containers, and build runners.",
    icon: "GitBranch",
    sortOrder: 2,
  },
  {
    slug: "web-servers",
    name: "Web Servers & Networking",
    description: "Implement raw socket listeners, HTTP/1.1 protocol parsers, stream multiplexers, and peer-to-peer BitTorrent networks.",
    icon: "Server",
    sortOrder: 3,
  },
  {
    slug: "compilers-languages",
    name: "Compilers, Interpreters & Languages",
    description: "Design lexers, recursive descent parsers, abstract syntax trees, and bytecode virtual machines.",
    icon: "Code",
    sortOrder: 4,
  },
  {
    slug: "frontend-frameworks",
    name: "Frontend Frameworks & UI Engines",
    description: "Demystify modern UI libraries by building custom virtual DOM diffing engines, reactive state hooks, and reconcilers.",
    icon: "Layout",
    sortOrder: 5,
  },
  {
    slug: "systems",
    name: "Systems Programming & Operating Systems",
    description: "Write bare-metal x86 bootloaders, kernel interrupts, hardware drivers, and terminal text editors.",
    icon: "Cpu",
    sortOrder: 6,
  },
  {
    slug: "ai-machine-learning",
    name: "Artificial Intelligence & Neural Networks",
    description: "Create neural networks, backpropagation engines, attention layers, and transformer architectures without black-box libraries.",
    icon: "BrainCircuit",
    sortOrder: 7,
  },
  {
    slug: "distributed-systems",
    name: "Distributed Systems & Message Brokers",
    description: "Build fault-tolerant distributed logs, commit protocols, leader election, and streaming message queues.",
    icon: "Network",
    sortOrder: 8,
  },
  {
    slug: "command-line-apps",
    name: "Command-Line Tools & Terminal Apps",
    description: "Develop high-performance command line utilities with argument parsing, streaming I/O, and ANSI terminal rendering.",
    icon: "Terminal",
    sortOrder: 9,
  },
  {
    slug: "search-engines",
    name: "Search Engines & Information Retrieval",
    description: "Build inverted indexes, tokenizers, TF-IDF ranking algorithms, and cosine similarity vector search.",
    icon: "Search",
    sortOrder: 10,
  },
];

const tutorialsData = [
  // 1. Build Your Own SQLite Database
  {
    slug: "build-your-own-sqlite-database",
    title: "Build Your Own SQLite Database from Scratch",
    categorySlug: "databases",
    language: "C",
    languages: ["C", "C++"],
    difficulty: "Intermediate",
    estimatedHours: 20,
    description: "Build a lightweight relational database inspired by SQLite, featuring a REPL front-end, bytecode compiler, in-memory paging, and B-Tree disk persistence.",
    whatYouWillBuild: "A functional relational database that accepts SQL queries (`INSERT`, `SELECT`), parses statements into internal bytecode instructions, stores records inside fixed-size 4KB memory pages, and persists tables to disk using a B-Tree structure.",
    whyBuildThis: "Most developers interact with relational databases through high-level ORMs without understanding how disk serialization, page caching, and B-Tree index lookups work under the hood. Building a database demystifies database internals.",
    realWorldApplications: "Relational database engines (SQLite, PostgreSQL), embedded cache engines, storage layer optimization, index tuning, and performance profiling.",
    expectedOutcome: "A compiled C executable that can create tables, insert thousands of rows, query by primary key in logarithmic time via B-Trees, and persist data across process restarts.",
    prerequisites: ["Basic understanding of C (pointers, memory management, structs)", "Familiarity with SQL syntax", "Basic tree data structures"],
    technologies: ["C", "POSIX File I/O", "B-Tree", "Paged Memory Storage", "REPL"],
    toolsRequired: ["GCC or Clang compiler", "Make", "GDB/Valgrind for memory verification"],
    learningOutcomes: [
      "Understand how SQL query text is transformed into executable bytecode",
      "Implement memory-paged storage architecture with 4096-byte blocks",
      "Build a B-Tree node layout supporting root splits and logarithmic searching",
      "Safely persist and restore records to and from disk",
      "Design an interactive REPL with custom meta-commands (.exit, .constants, .btree)"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "Connor Stack (cstack)",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: true,
    sortOrder: 1,
    resources: [
      {
        title: "Let's Build a Simple Database Tutorial",
        url: "https://cstack.github.io/db_tutorial/",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "Comprehensive step-by-step tutorial on building a database in C.",
        author: "Connor Stack",
      },
      {
        title: "SQLite Database Architecture Specification",
        url: "https://www.sqlite.org/arch.html",
        resourceType: "OFFICIAL_DOCS",
        description: "Official SQLite documentation explaining the Virtual Database Engine (VDBE) and B-Tree module.",
        author: "SQLite Team",
      },
      {
        title: "Connor Stack's db_tutorial GitHub Repository",
        url: "https://github.com/cstack/db_tutorial",
        resourceType: "GITHUB_REPO",
        description: "Complete companion source code with automated tests in Ruby.",
        author: "Connor Stack",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Design the Interactive REPL & Input Buffer",
        objective: "Create the Read-Eval-Print Loop that accepts commands, handles buffer resizing, and parses meta-commands like .exit.",
        whyNecessary: "All database systems require a client interface to accept query strings from users or socket connections.",
        content: "Implement an InputBuffer struct that wraps getline() to dynamically allocate memory as the user types commands. Intercept meta-commands beginning with a dot ('.exit') to cleanly exit the REPL without executing SQL parser routines.",
        codeSnippet: `typedef struct {\n  char* buffer;\n  size_t buffer_length;\n  ssize_t input_length;\n} InputBuffer;\n\nInputBuffer* new_input_buffer() {\n  InputBuffer* input_buffer = malloc(sizeof(InputBuffer));\n  input_buffer->buffer = NULL;\n  input_buffer->buffer_length = 0;\n  input_buffer->input_length = 0;\n  return input_buffer;\n}`,
        codeLanguage: "c",
        concepts: ["Dynamic memory allocation", "POSIX getline", "REPL architecture", "Buffer overflow prevention"],
        referenceUrls: ["https://cstack.github.io/db_tutorial/parts/part1.html", "https://man7.org/linux/man-pages/man3/getline.3.html"],
        expectedResult: "Running the executable outputs 'db > ' prompt. Typing '.exit' terminates the process with code 0."
      },
      {
        stepNumber: 2,
        title: "Implement the SQL Tokenizer & Prepared Statement Parser",
        objective: "Convert raw input text into strongly-typed Statement structs (STATEMENT_INSERT, STATEMENT_SELECT).",
        whyNecessary: "Separating query parsing from execution prevents SQL injection and prepares commands for the virtual machine.",
        content: "Build a prepare_statement() function that inspects the first token. For 'insert', parse arguments using sscanf() into a Row struct (id, username, email). Validate string lengths to protect against buffer overflows.",
        codeSnippet: `typedef enum { PREPARE_SUCCESS, PREPARE_SYNTAX_ERROR, PREPARE_UNRECOGNIZED_STATEMENT } PrepareResult;\ntypedef enum { STATEMENT_INSERT, STATEMENT_SELECT } StatementType;\n\ntypedef struct {\n  StatementType type;\n  Row row_to_insert;\n} Statement;`,
        codeLanguage: "c",
        concepts: ["Lexical analysis", "Abstract statement representation", "String bounds checking"],
        referenceUrls: ["https://cstack.github.io/db_tutorial/parts/part2.html"],
        expectedResult: "Commands like 'insert 1 user user@example.com' are recognized and stored in the statement object."
      },
      {
        stepNumber: 3,
        title: "Define the Row Layout & In-Memory Pager",
        objective: "Design a compact binary memory layout for rows and group rows into fixed 4096-byte pages.",
        whyNecessary: "Databases organize memory in fixed-size blocks (pages) matching operating system page sizes to minimize disk fragmentation and maximize I/O throughput.",
        content: "Define COLUMN_USERNAME_SIZE (32) and COLUMN_EMAIL_SIZE (255). Serialize rows into contiguous bytes within pages. Create a Table struct holding an array of 100 page pointers that are allocated on demand.",
        codeSnippet: `#define PAGE_SIZE 4096\n#define TABLE_MAX_PAGES 100\n\ntypedef struct {\n  int file_descriptor;\n  uint32_t file_length;\n  void* pages[TABLE_MAX_PAGES];\n} Pager;`,
        codeLanguage: "c",
        concepts: ["Compact memory serialization", "Offset calculations", "Cache line alignment", "Paging"],
        referenceUrls: ["https://cstack.github.io/db_tutorial/parts/part3.html"],
        expectedResult: "Multiple rows can be inserted and retrieved from contiguous memory pages without corruption."
      },
      {
        stepNumber: 4,
        title: "Disk Persistence & Flushing with Paged I/O",
        objective: "Save all cached memory pages to a persistent file when the database closes, and reload them on boot.",
        whyNecessary: "Without persistence, data is lost when the database process exits.",
        content: "Open a file descriptor using open() with O_RDWR | O_CREAT flags. On db_open(), read the file size to calculate row counts. On db_close(), iterate through allocated pages and write() them sequentially before freeing memory.",
        codeSnippet: `void pager_flush(Pager* pager, uint32_t page_num, uint32_t size) {\n  lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);\n  write(pager->file_descriptor, pager->pages[page_num], size);\n}`,
        codeLanguage: "c",
        concepts: ["POSIX open/lseek/write", "File descriptor management", "Dirty page flushing"],
        referenceUrls: ["https://cstack.github.io/db_tutorial/parts/part4.html"],
        expectedResult: "Inserting 10 rows, exiting the database, and restarting it preserves all 10 rows on SELECT."
      },
      {
        stepNumber: 5,
        title: "B-Tree Node Architecture & Leaf Node Layout",
        objective: "Replace the flat array storage with a B-Tree leaf node format capable of sorting keys.",
        whyNecessary: "A flat array requires O(N) linear scans to find a record. A B-Tree enables O(log N) searches and range queries.",
        content: "Define header fields in each 4KB leaf node: is_root, parent_pointer, num_cells. Each cell stores a uint32_t key followed by the serialized Row value. Keep cells sorted by key to enable binary search.",
        codeSnippet: `// Leaf node header layout\nconst uint32_t LEAF_NODE_NUM_CELLS_SIZE = sizeof(uint32_t);\nconst uint32_t LEAF_NODE_NUM_CELLS_OFFSET = COMMON_NODE_HEADER_SIZE;\nconst uint32_t LEAF_NODE_HEADER_SIZE = COMMON_NODE_HEADER_SIZE + LEAF_NODE_NUM_CELLS_SIZE;`,
        codeLanguage: "c",
        concepts: ["B-Tree leaf node design", "Cell pointers", "Binary search on disk pages"],
        referenceUrls: ["https://cstack.github.io/db_tutorial/parts/part7.html"],
        expectedResult: "Keys are inserted in sorted order, enabling binary searching within leaf nodes in logarithmic time."
      },
      {
        stepNumber: 6,
        title: "B-Tree Node Splitting & Multi-Level Trees",
        objective: "Implement leaf node splitting and internal routing nodes when a page exceeds 4096 bytes.",
        whyNecessary: "When a leaf node is full, the tree must split into two sibling nodes and create an internal parent node to maintain logarithmic depth.",
        content: "When leaf_node_num_cells reaches max capacity, allocate a new page. Copy the upper half of cells into the sibling page. Create or update an internal node storing child page numbers and pivot keys. Update the root pointer.",
        codeSnippet: `void leaf_node_split_and_insert(Cursor* cursor, uint32_t key, Row* value) {\n  void* old_node = get_page(cursor->table->pager, cursor->page_num);\n  uint32_t new_page_num = get_unused_page_num(cursor->table->pager);\n  void* new_node = get_page(cursor->table->pager, new_page_num);\n  // Distribute cells evenly between old and new nodes\n}`,
        codeLanguage: "c",
        concepts: ["B-Tree splitting", "Internal node routing", "Tree rebalancing", "Logarithmic growth"],
        referenceUrls: ["https://cstack.github.io/db_tutorial/parts/part9.html"],
        expectedResult: "The database seamlessly handles inserting 10,000+ rows, automatically growing tree depth."
      }
    ]
  },

  // 2. Build Your Own Redis
  {
    slug: "build-your-own-redis",
    title: "Build Your Own Redis from Scratch",
    categorySlug: "databases",
    language: "C++",
    languages: ["C++", "Go"],
    difficulty: "Advanced",
    estimatedHours: 25,
    description: "Implement a high-performance in-memory key-value database supporting the Redis Serialization Protocol (RESP), non-blocking event loops, hashtables, and TTL expiration.",
    whatYouWillBuild: "A single-threaded, event-driven TCP server that implements core Redis commands (`SET`, `GET`, `DEL`, `EXPIRE`, `KEYS`), speaks the standard RESP protocol, and supports concurrent client connections via epoll / kqueue.",
    whyBuildThis: "Redis achieves millions of operations per second using a single-threaded asynchronous event loop. Building it will teach you low-level socket multiplexing, cache eviction, and high-performance hashtable design.",
    realWorldApplications: "Distributed caching, rate limiting, pub/sub messaging systems, microservice acceleration, and session management.",
    expectedOutcome: "A server executable that passes real `redis-benchmark` tests and works with the official `redis-cli` tool.",
    prerequisites: ["Proficiency in C++ or C", "Familiarity with TCP sockets and networking", "Understanding of hashtable collision resolution"],
    technologies: ["C++", "POSIX epoll / poll", "RESP Protocol", "Hashtables", "Intrusive Data Structures"],
    toolsRequired: ["Clang++ or GCC", "redis-cli (for testing client queries)", "netcat"],
    learningOutcomes: [
      "Understand the mechanics of asynchronous non-blocking network I/O with poll/epoll",
      "Implement the RESP (Redis Serialization Protocol) binary-safe wire format",
      "Design progressive hashtable resizing to avoid latency spikes during growth",
      "Implement key TTL tracking with sorted sets and randomized sampling eviction",
      "Measure and optimize server latency down to sub-millisecond ranges"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "James Smith (build-your-own.org)",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: true,
    sortOrder: 2,
    resources: [
      {
        title: "Build Your Own Redis From Scratch Guide",
        url: "https://build-your-own.org/redis",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "Authoritative architectural guide for building a Redis-compatible server.",
        author: "James Smith",
      },
      {
        title: "Official Redis Protocol Specification (RESP2/RESP3)",
        url: "https://redis.io/docs/reference/protocol-spec/",
        resourceType: "SPECIFICATION",
        description: "Official wire specification detailing Simple Strings, Errors, Integers, Bulk Strings, and Arrays.",
        author: "Redis Ltd",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Set Up Socket Server & Non-Blocking Sockets",
        objective: "Initialize a TCP listener socket on port 6379 and configure it for non-blocking I/O using fcntl.",
        whyNecessary: "Blocking sockets cause a server to halt while waiting for one client, freezing all other connected clients.",
        content: "Call socket(), bind() to 0.0.0.0:6379, and listen(). Use fcntl(fd, F_SETFL, O_NONBLOCK) on the listening socket and every newly accepted client connection.",
        codeSnippet: `int fd = socket(AF_INET, SOCK_STREAM, 0);\nint val = 1;\nsetsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &val, sizeof(val));\n// Set non-blocking\nfcntl(fd, F_SETFL, fcntl(fd, F_GETFL, 0) | O_NONBLOCK);\nbind(fd, (struct sockaddr*)&addr, sizeof(addr));\nlisten(fd, SOMAXCONN);`,
        codeLanguage: "cpp",
        concepts: ["TCP socket lifecycle", "O_NONBLOCK flag", "SO_REUSEADDR", "File descriptors"],
        referenceUrls: ["https://build-your-own.org/redis/03_hello_server"],
        expectedResult: "Server boots on port 6379 and accepts connections via netcat or telnet without blocking."
      },
      {
        stepNumber: 2,
        title: "The Event Loop with poll() / epoll()",
        objective: "Manage hundreds of concurrent connections using an event multiplexer.",
        whyNecessary: "An event loop lets a single thread monitor multiple sockets, only waking up when data is ready to be read or written.",
        content: "Maintain a dynamic vector of struct pollfd. Add the server socket with POLLIN to accept incoming connections. Add active client sockets with POLLIN to read data. Remove closed sockets to prevent fd leaks.",
        codeSnippet: `std::vector<struct pollfd> poll_args;\n// Add listening socket and all active connections\nint rv = poll(poll_args.data(), (nfds_t)poll_args.size(), 1000);`,
        codeLanguage: "cpp",
        concepts: ["I/O Multiplexing", "Event loop architecture", "Connection lifecycle"],
        referenceUrls: ["https://build-your-own.org/redis/04_event_loop"],
        expectedResult: "Multiple simultaneous netcat connections can connect without hanging the server."
      },
      {
        stepNumber: 3,
        title: "Parse the Redis Serialization Protocol (RESP)",
        objective: "Parse array-of-bulk-strings command framing: '*<count>\\r\\n$<len>\\r\\n<data>\\r\\n'.",
        whyNecessary: "RESP is binary-safe and allows Redis to handle keys and values containing any byte, including null terminators and newlines.",
        content: "Implement a zero-copy buffer scanner. Detect message boundaries marked by CRLF (\\r\\n). Parse bulk strings by length header to avoid scanning payload bytes.",
        codeSnippet: `// Parse RESP: *2\\r\\n$3\\r\\nGET\\r\\n$4\\r\\nname\\r\\n\nint parse_req(const uint8_t *data, size_t len, std::vector<std::string> &out) {\n  if (data[0] != '*') return -1;\n  // Parse count of bulk strings and extract string payloads\n}`,
        codeLanguage: "cpp",
        concepts: ["Wire protocol parsing", "Binary-safe framing", "Buffer chunking"],
        referenceUrls: ["https://redis.io/docs/reference/protocol-spec/"],
        expectedResult: "Executing 'redis-cli -p 6379 PING' parses correctly and responds with '+PONG\\r\\n'."
      },
      {
        stepNumber: 4,
        title: "Implement the In-Memory Key-Value Hashtable",
        objective: "Build an efficient hashtable to store string keys and values with constant time O(1) lookups.",
        whyNecessary: "Redis's primary value proposition is sub-millisecond key-value retrieval from RAM.",
        content: "Implement chaining collision resolution with MurmurHash3 or SipHash. Implement progressive resizing (two internal tables) so resizing is distributed over successive queries without freezing the server.",
        codeSnippet: `struct HNode {\n  HNode *next = nullptr;\n  uint64_t hcode = 0;\n};\n\nstruct HTable {\n  HNode **tab = nullptr;\n  size_t mask = 0;\n  size_t size = 0;\n};`,
        codeLanguage: "cpp",
        concepts: ["Hash functions", "Collision chaining", "Incremental rehashing"],
        referenceUrls: ["https://build-your-own.org/redis/06_hashtable"],
        expectedResult: "'SET key val' returns '+OK\\r\\n', and 'GET key' returns '$3\\r\\nval\\r\\n'."
      },
      {
        stepNumber: 5,
        title: "Key Expiration & TTL Management",
        objective: "Implement EXPIRE, TTL, and automatic background eviction of stale keys.",
        whyNecessary: "Without TTL expiration, in-memory caches quickly exhaust available RAM and crash.",
        content: "Maintain a secondary hashtable or min-heap mapping keys to expiration timestamps (millisecond epoch). On each event loop tick, sample 20 keys with TTLs and purge expired ones.",
        codeSnippet: `std::map<std::string, uint64_t> ttl_map;\n\nvoid purge_expired_keys() {\n  uint64_t now = get_current_time_ms();\n  // Check random sample of TTL keys and delete if now >= expiration\n}`,
        codeLanguage: "cpp",
        concepts: ["Active and passive eviction", "Millisecond epoch clocks", "Memory reclamation"],
        referenceUrls: ["https://build-your-own.org/redis/09_ttl"],
        expectedResult: "Keys set with 'EXPIRE mykey 2' disappear from GET requests after exactly 2 seconds."
      }
    ]
  },

  // 3. Build Your Own Git
  {
    slug: "build-your-own-git",
    title: "Write Yourself a Git! (Content-Addressable Storage)",
    categorySlug: "developer-tools",
    language: "Python",
    languages: ["Python", "JavaScript", "Rust"],
    difficulty: "Beginner",
    estimatedHours: 12,
    description: "Build a complete Git client from scratch in Python, implementing content-addressable storage, blob/tree/commit objects, zlib compression, and repository staging.",
    whatYouWillBuild: "A custom command-line program (`wyag` or `mygit`) capable of initializing a `.git` directory, hashing files into blobs, organizing directory trees, generating commit objects, and checking out branches.",
    whyBuildThis: "Git is universally used by software engineers, yet treated as a mysterious black box. By writing a Git client from scratch, you will realize that Git is simply an elegant directed acyclic graph (DAG) stored on top of a content-addressable object store.",
    realWorldApplications: "Version control systems, distributed backup engines, content-addressable storage (IPFS), build caches, and cryptographic verification.",
    expectedOutcome: "A CLI tool that can initialize a repository, add files, make commits, and produce commits that are 100% interoperable with the official `git` command.",
    prerequisites: ["Basic Python knowledge", "Understanding of file I/O and SHA-1 hashing", "Familiarity with Git command line"],
    technologies: ["Python", "SHA-1 / Cryptography", "zlib Compression", "Content-Addressable Storage", "DAG (Directed Acyclic Graph)"],
    toolsRequired: ["Python 3.10+", "Official Git CLI (to verify compatibility)"],
    learningOutcomes: [
      "Understand the internal file structure of the `.git` directory",
      "Implement the 4 fundamental Git object types: blob, tree, commit, tag",
      "Compress and decompress objects using zlib with SHA-1 addressing",
      "Parse and construct binary tree objects representing directories",
      "Traverse commit parent chains to inspect repository history"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "Thibault Polge (wyag)",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: true,
    sortOrder: 3,
    resources: [
      {
        title: "Write Yourself a Git! (WYAG) Official Book",
        url: "https://wyag.thb.lt/",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "The definitive guide to building Git from the bottom up in Python.",
        author: "Thibault Polge",
      },
      {
        title: "Git Internals - Git Objects (Pro Git Book)",
        url: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects",
        resourceType: "OFFICIAL_DOCS",
        description: "Official Git documentation explaining object storage and hashing.",
        author: "Scott Chacon & Ben Straub",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Initialize the .git Directory Hierarchy",
        objective: "Create the standard repository structure: .git/objects, .git/refs/heads, and .git/HEAD.",
        whyNecessary: "Every Git repository is governed by standard file locations that store configuration, branches, and object databases.",
        content: "Implement `init [path]` command. Create directories `.git/objects/`, `.git/refs/heads/`, and `.git/refs/tags/`. Create `.git/HEAD` containing 'ref: refs/heads/master\\n' and `.git/config` with basic repository configuration.",
        codeSnippet: `import os\n\ndef repo_create(path):\n    os.makedirs(os.path.join(path, ".git", "objects"), exist_ok=True)\n    os.makedirs(os.path.join(path, ".git", "refs", "heads"), exist_ok=True)\n    with open(os.path.join(path, ".git", "HEAD"), "w") as f:\n        f.write("ref: refs/heads/master\\n")`,
        codeLanguage: "python",
        concepts: ["Directory layout", "HEAD reference", "Repository initialization"],
        referenceUrls: ["https://wyag.thb.lt/#init"],
        expectedResult: "Running 'mygit init' generates a directory that the official 'git status' recognizes as a valid repository."
      },
      {
        stepNumber: 2,
        title: "The Object Database & Blob Storage",
        objective: "Hash files using SHA-1, prepend the object header, compress with zlib, and store under .git/objects/xx/yyyy...",
        whyNecessary: "Content-addressability means files with identical content share the exact same hash, preventing duplicate storage.",
        content: "Git objects follow the format: `<type> <length>\\x00<data>`. Compute `hash = sha1(formatted_bytes)`. The first 2 characters form the subfolder inside `.git/objects/`, and the remaining 38 form the filename.",
        codeSnippet: `import hashlib, zlib\n\ndef object_write(data, type_name="blob"):\n    header = f"{type_name} {len(data)}\\x00".encode()\n    full_content = header + data\n    sha = hashlib.sha1(full_content).hexdigest()\n    path = os.path.join(".git", "objects", sha[:2], sha[2:])\n    os.makedirs(os.path.dirname(path), exist_ok=True)\n    with open(path, "wb") as f:\n        f.write(zlib.compress(full_content))\n    return sha`,
        codeLanguage: "python",
        concepts: ["SHA-1 hashing", "zlib compression", "Content-addressable storage"],
        referenceUrls: ["https://wyag.thb.lt/#objects"],
        expectedResult: "Writing 'hello world' produces hash `3b18e512dba79e4c8300dd08aeb37f8e728b8dad` exactly matching `git hash-object`."
      },
      {
        stepNumber: 3,
        title: "Read Objects with 'cat-file'",
        objective: "Decompress an object from disk using its SHA-1 hash, verify the header, and display its contents.",
        whyNecessary: "Reading objects is required to inspect history, view previous file revisions, and check out commits.",
        content: "Read the file at `.git/objects/{sha[:2]}/{sha[2:]}`, decompress using `zlib.decompress()`, split at the null byte `\\x00` to extract type and length, and return the payload.",
        codeSnippet: `def object_read(sha):\n    path = os.path.join(".git", "objects", sha[:2], sha[2:])\n    with open(path, "rb") as f:\n        raw = zlib.decompress(f.read())\n    null_idx = raw.find(b'\\x00')\n    header = raw[:null_idx].decode()\n    type_name, size = header.split()\n    return type_name, raw[null_idx+1:]`,
        codeLanguage: "python",
        concepts: ["Object deserialization", "Null byte delimiters", "Header validation"],
        referenceUrls: ["https://wyag.thb.lt/#cat-file"],
        expectedResult: "'mygit cat-file -p <hash>' prints the original file contents to stdout."
      },
      {
        stepNumber: 4,
        title: "Tree Objects (Directories & Permissions)",
        objective: "Serialize folder structures into Git tree objects containing file permissions, names, and SHA-1 hashes.",
        whyNecessary: "While blobs store file contents, trees store filenames, directory structures, and UNIX file permissions (100644 for files, 040000 for directories).",
        content: "Parse binary tree records: `<mode> <filename>\\x00<binary_sha20>`. Implement `ls-tree` to list contents of a directory node recursively.",
        codeSnippet: `def tree_parse_one(raw, start=0):\n    space = raw.find(b' ', start)\n    mode = raw[start:space]\n    null = raw.find(b'\\x00', space)\n    name = raw[space+1:null].decode()\n    sha = raw[null+1:null+21].hex()\n    return null + 21, (mode, name, sha)`,
        codeLanguage: "python",
        concepts: ["Binary tree encoding", "File mode octals", "Hierarchical data representation"],
        referenceUrls: ["https://wyag.thb.lt/#tree"],
        expectedResult: "'mygit ls-tree <tree-hash>' prints all files and child folders in the tree."
      },
      {
        stepNumber: 5,
        title: "Commit Objects & Commit History Traversal",
        objective: "Create commit objects tying together a root tree, parent commit hash, author info, timestamp, and commit message.",
        whyNecessary: "Commits record snapshots of the tree at specific moments in time, creating the immutable ledger of software history.",
        content: "Format commit objects: `tree <hash>\\nparent <hash>\\nauthor Name <email> timestamp tz\\ncommitter ...\\n\\nCommit message\\n`. Implement `log` to walk parent pointers backwards to the initial commit.",
        codeSnippet: `def commit_create(tree_sha, parent_sha, message, author="Developer <dev@flowctrl.io>"):\n    data = f"tree {tree_sha}\\n"\n    if parent_sha:\n        data += f"parent {parent_sha}\\n"\n    data += f"author {author} 1700000000 +0000\\n"\n    data += f"committer {author} 1700000000 +0000\\n\\n"\n    data += f"{message}\\n"\n    return object_write(data.encode(), "commit")`,
        codeLanguage: "python",
        concepts: ["Commit formatting", "Directed Acyclic Graphs (DAG)", "History traversal"],
        referenceUrls: ["https://wyag.thb.lt/#commit"],
        expectedResult: "Creating a commit produces a hash recognized by official `git log`."
      }
    ]
  },

  // 4. Build Your Own Docker (Linux Containers)
  {
    slug: "build-your-own-docker",
    title: "Build Your Own Container Using Less Than 100 Lines of Go",
    categorySlug: "developer-tools",
    language: "Go",
    languages: ["Go", "C"],
    difficulty: "Advanced",
    estimatedHours: 15,
    description: "Understand Linux containerization from first principles by creating an isolated process runtime using Linux namespaces, cgroups, chroot, and syscalls in Go.",
    whatYouWillBuild: "A container engine CLI (`docker run <cmd>`) that isolates processes with their own hostname, process tree (PID 1), filesystem root, and memory limits using native Linux kernel primitives.",
    whyBuildThis: "Containers are not magical virtual machines; they are ordinary processes restricted by Linux namespaces and control groups. Building your own container runner gives you deep insight into container security, Kubernetes scheduling, and Docker runtime behavior.",
    realWorldApplications: "Docker, containerd, Kubernetes worker runtimes, sandboxed code execution (like JudgeX in flowCTRL), and security sandboxing.",
    expectedOutcome: "A Go program that executes `/bin/sh` inside an isolated container with its own private PID tree, custom hostname, and sandboxed root filesystem.",
    prerequisites: ["Go programming basics", "Linux fundamentals (fork/exec, file permissions)", "Access to a Linux environment or WSL2"],
    technologies: ["Go", "Linux Namespaces (UTS, PID, MNT)", "Control Groups (cgroups v2)", "chroot / pivot_root", "Syscalls"],
    toolsRequired: ["Go 1.20+", "Linux OS or WSL2 with sudo privileges", "Alpine minirootfs tarball"],
    learningOutcomes: [
      "Understand what Linux namespaces actually do (UTS, PID, Mount, Network)",
      "Re-exec Go processes to achieve PID 1 isolation inside child containers",
      "Isolate filesystems using chroot and mount private procfs filesystems",
      "Restrict memory and CPU consumption using Linux cgroups",
      "Secure container environments against privilege escalation"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "Liz Rice",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: true,
    sortOrder: 4,
    resources: [
      {
        title: "Building a Container From Scratch in Go (Liz Rice Talk)",
        url: "https://www.youtube.com/watch?v=8fi7uSYlOdc",
        resourceType: "VIDEO",
        description: "The classic keynote presentation demonstrating container creation live on stage.",
        author: "Liz Rice",
      },
      {
        title: "Build Your Own Container Using Less than 100 Lines of Go Article",
        url: "https://www.infoq.com/articles/build-a-container-golang",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "Step-by-step article by Liz Rice detailing the code and syscalls.",
        author: "Liz Rice",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Fork and Execute Arbitrary Commands",
        objective: "Build the baseline runner using os/exec that takes arguments and executes them via exec.Command.",
        whyNecessary: "Container runtimes start by executing an entrypoint process on behalf of the user.",
        content: "Implement `main()` parsing `run <command> <args>`. Use `exec.Command(os.Args[2], os.Args[3:]...)` and bind Stdin, Stdout, and Stderr to the terminal.",
        codeSnippet: `package main\n\nimport (\n    "os"\n    "os/exec"\n)\n\nfunc run() {\n    cmd := exec.Command(os.Args[2], os.Args[3:]...)\n    cmd.Stdin = os.Stdin\n    cmd.Stdout = os.Stdout\n    cmd.Stderr = os.Stderr\n    cmd.Run()\n}`,
        codeLanguage: "go",
        concepts: ["Process execution", "Standard I/O streams", "CLI argument parsing"],
        referenceUrls: ["https://pkg.go.dev/os/exec"],
        expectedResult: "'go run main.go run echo hello' prints 'hello' to stdout."
      },
      {
        stepNumber: 2,
        title: "Isolate Hostname with UTS Namespace",
        objective: "Provide the container its own distinct hostname using Cloneflags: syscall.CLONE_NEWUTS.",
        whyNecessary: "UTS (UNIX Timesharing System) namespace prevents changes to the container hostname from affecting the host machine.",
        content: "Attach `SysProcAttr` with `CLONE_NEWUTS`. Inside the child process, call `syscall.Sethostname([]byte(\"container\"))`.",
        codeSnippet: `cmd.SysProcAttr = &syscall.SysProcAttr{\n    Cloneflags: syscall.CLONE_NEWUTS,\n}`,
        codeLanguage: "go",
        concepts: ["Linux namespaces", "CLONE_NEWUTS", "SysProcAttr"],
        referenceUrls: ["https://man7.org/linux/man-pages/man7/namespaces.7.html"],
        expectedResult: "Changing hostname inside the container to 'my-box' does not modify the host's hostname."
      },
      {
        stepNumber: 3,
        title: "Isolate Process Tree with PID Namespace",
        objective: "Make the container's entrypoint process believe it is PID 1 using CLONE_NEWPID.",
        whyNecessary: "In Linux, PID 1 is the init system. Isolate the process tree so the container cannot inspect or terminate host processes.",
        content: "Because PID namespace only takes effect on child processes, re-execute the program binary (`/proc/self/exe child <args>`) with `CLONE_NEWPID` enabled.",
        codeSnippet: `cmd := exec.Command("/proc/self/exe", append([]string{"child"}, os.Args[2:]...)...)\ncmd.SysProcAttr = &syscall.SysProcAttr{\n    Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID,\n}`,
        codeLanguage: "go",
        concepts: ["PID namespace", "Self-re-execution (/proc/self/exe)", "PID 1 isolation"],
        referenceUrls: ["https://man7.org/linux/man-pages/man7/pid_namespaces.7.html"],
        expectedResult: "'ps' inside the container only displays processes spawned within the container."
      },
      {
        stepNumber: 4,
        title: "Filesystem Sandboxing with chroot & Mounts",
        objective: "Confine the container to a dedicated root filesystem directory and mount a private procfs.",
        whyNecessary: "Without filesystem isolation, the container can read and modify sensitive host files like /etc/passwd or /root.",
        content: "Download an Alpine Linux rootfs. In the child process, call `syscall.Chroot(\"/path/to/rootfs\")`, `os.Chdir(\"/\")`, and mount procfs using `syscall.Mount(\"proc\", \"/proc\", \"proc\", 0, \"\")`.",
        codeSnippet: `syscall.Chroot("/path/to/rootfs")\nos.Chdir("/")\nsyscall.Mount("proc", "/proc", "proc", 0, "")`,
        codeLanguage: "go",
        concepts: ["chroot", "procfs mounting", "Filesystem root jail"],
        referenceUrls: ["https://man7.org/linux/man-pages/man2/chroot.2.html"],
        expectedResult: "Running 'ls /' inside container reveals only the Alpine rootfs files."
      },
      {
        stepNumber: 5,
        title: "Resource Restrictions with cgroups v2",
        objective: "Limit the container's memory consumption to 100MB and cap max pids to prevent fork bombs.",
        whyNecessary: "Control groups (cgroups) prevent a single buggy or malicious container from consuming all host RAM and crashing the server.",
        content: "Create a new cgroup directory under `/sys/fs/cgroup/flowctrl/`. Write `100M` to `memory.max` and `20` to `pids.max`. Append the child process PID to `cgroup.procs`.",
        codeSnippet: `os.WriteFile("/sys/fs/cgroup/flowctrl/memory.max", []byte("100M"), 0700)\nos.WriteFile("/sys/fs/cgroup/flowctrl/cgroup.procs", []byte(strconv.Itoa(os.Getpid())), 0700)`,
        codeLanguage: "go",
        concepts: ["Linux cgroups v2", "Resource capping", "Denial-of-Service prevention"],
        referenceUrls: ["https://man7.org/linux/man-pages/man7/cgroups.7.html"],
        expectedResult: "A memory-leaking process inside the container is killed by the OOM killer when hitting 100MB without affecting the host."
      }
    ]
  },

  // 5. Build Your Own React (Didact)
  {
    slug: "build-your-own-react",
    title: "Build Your Own React: Concurrent Fiber Architecture",
    categorySlug: "frontend-frameworks",
    language: "JavaScript",
    languages: ["JavaScript", "TypeScript"],
    difficulty: "Intermediate",
    estimatedHours: 14,
    description: "Construct a complete implementation of React from scratch: createElement, JSX rendering, concurrent fiber tree reconciliation, work loops, and hooks (useState, useEffect).",
    whatYouWillBuild: "A 400-line front-end library (`Didact`) that replicates React 18: converts JSX to virtual DOM, breaks rendering work into incremental fiber units with requestIdleCallback, performs DOM diffing, and manages reactive component state.",
    whyBuildThis: "Front-end developers use React every day, but few understand how Fiber reconciliation avoids blocking the main thread, or how hooks maintain order across renders. Building React demystifies the entire modern web UI paradigm.",
    realWorldApplications: "Front-end engineering, custom UI rendering engines, canvas renderers, performance optimization, and custom component libraries.",
    expectedOutcome: "A functioning React clone that renders interactive UI components with stateful click counters and conditional DOM updates.",
    prerequisites: ["Strong JavaScript ES6+ knowledge (closures, recursion, objects)", "Familiarity with React components and JSX", "Understanding of the browser event loop"],
    technologies: ["JavaScript", "Virtual DOM", "Fiber Tree Reconciliation", "requestIdleCallback", "Reactive Hooks"],
    toolsRequired: ["Node.js", "Vite or Webpack for JSX transpilation", "Modern web browser"],
    learningOutcomes: [
      "Understand how JSX compiles to nested createElement function calls",
      "Build a Fiber node linked list structure (child, sibling, parent)",
      "Implement a cooperative concurrent work loop using requestIdleCallback",
      "Perform DOM reconciliation (diffing) to minimize real DOM mutations",
      "Implement the useState hook using closures and fiber hook queues"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "Rodrigo Pombo (Didact)",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: true,
    sortOrder: 5,
    resources: [
      {
        title: "Build Your Own React (Didact) Official Guide",
        url: "https://github.com/hexacta/didact",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "The celebrated interactive tutorial on writing React from scratch.",
        author: "Rodrigo Pombo",
      },
      {
        title: "React Fiber Architecture Specification",
        url: "https://github.com/acdlite/react-fiber-architecture",
        resourceType: "SPECIFICATION",
        description: "Official description of React Fiber by Andrew Clark.",
        author: "Andrew Clark",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "The createElement Function & Virtual DOM",
        objective: "Write createElement to transform JSX objects into lightweight JavaScript virtual DOM descriptors.",
        whyNecessary: "JSX is syntactic sugar that compiles to function calls returning tree nodes with { type, props: { children } }.",
        content: "Implement `createElement(type, props, ...children)` returning an object with `type` and `props`. Wrap text primitives in `TEXT_ELEMENT` types for uniform tree handling.",
        codeSnippet: `function createElement(type, props, ...children) {\n  return {\n    type,\n    props: {\n      ...props,\n      children: children.map(child =>\n        typeof child === "object" ? child : createTextElement(child)\n      ),\n    },\n  };\n}`,
        codeLanguage: "javascript",
        concepts: ["Virtual DOM", "JSX compilation", "Descriptor trees"],
        referenceUrls: ["https://pomb.us/build-your-own-react/"],
        expectedResult: "Calling `createElement('div', { id: 'root' }, 'Hello')` returns the expected vDOM tree object."
      },
      {
        stepNumber: 2,
        title: "Recursive DOM Rendering & Its Limitations",
        objective: "Implement render() to recursively convert Virtual DOM nodes into real browser DOM elements.",
        whyNecessary: "Understanding basic recursive rendering reveals why deep trees freeze the browser without Fiber.",
        content: "Create elements with `document.createElement(fiber.type)`. Assign props and event listeners. Recursively call `render()` on all children.",
        codeSnippet: `function render(element, container) {\n  const dom = element.type === "TEXT_ELEMENT"\n    ? document.createTextNode("")\n    : document.createElement(element.type);\n  Object.keys(element.props)\n    .filter(key => key !== "children")\n    .forEach(name => { dom[name] = element.props[name]; });\n  element.props.children.forEach(child => render(child, dom));\n  container.appendChild(dom);\n}`,
        codeLanguage: "javascript",
        concepts: ["DOM creation", "Event listener binding", "Main thread blocking"],
        referenceUrls: ["https://pomb.us/build-your-own-react/"],
        expectedResult: "Elements appear in the real browser DOM document."
      },
      {
        stepNumber: 3,
        title: "Concurrent Work Loop & Fiber Node Structure",
        objective: "Break rendering into atomic units of work using requestIdleCallback and a Fiber linked list.",
        whyNecessary: "If the component tree is huge, recursive rendering blocks the main thread. A cooperative work loop yields to user input and animations.",
        content: "Structure each Fiber node with `child`, `sibling`, and `parent` pointers. Write `workLoop(deadline)` that executes units of work until time expires, then yields back to the browser.",
        codeSnippet: `let nextUnitOfWork = null;\n\nfunction workLoop(deadline) {\n  let shouldYield = false;\n  while (nextUnitOfWork && !shouldYield) {\n    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);\n    shouldYield = deadline.timeRemaining() < 1;\n  }\n  requestIdleCallback(workLoop);\n}\nrequestIdleCallback(workLoop);`,
        codeLanguage: "javascript",
        concepts: ["Fiber linked list", "requestIdleCallback", "Cooperative multitasking"],
        referenceUrls: ["https://pomb.us/build-your-own-react/"],
        expectedResult: "Complex UI rendering no longer drops 60 FPS animation frames."
      },
      {
        stepNumber: 4,
        title: "Fiber Tree Reconciliation & Commit Phase",
        objective: "Compare previous fibers with new elements to generate UPDATE, PLACEMENT, and DELETION tags, then commit mutations in one batch.",
        whyNecessary: "Mutating the real DOM piece-by-piece causes visual stutter and layout thrashing. Calculating diffs first and committing all at once ensures smooth updates.",
        content: "In `reconcileChildren`, compare `oldFiber.type` with `newElement.type`. If identical, reuse DOM node with `UPDATE` tag. If different, create new node with `PLACEMENT` tag and schedule old node with `DELETION`. Commit all DOM updates in `commitRoot()`.",
        codeSnippet: `function reconcileChildren(wipFiber, elements) {\n  let index = 0;\n  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;\n  // Compare oldFiber vs new elements and set effectTag: PLACEMENT, UPDATE, DELETION\n}`,
        codeLanguage: "javascript",
        concepts: ["Virtual DOM diffing", "Commit phase", "Tagging side effects"],
        referenceUrls: ["https://pomb.us/build-your-own-react/"],
        expectedResult: "Modifying text updates only the changed DOM text node without replacing the container."
      },
      {
        stepNumber: 5,
        title: "Functional Components & the useState Hook",
        objective: "Support function components like `<Counter />` and reactive state updates via useState.",
        whyNecessary: "Modern React relies on functional components and hooks for clean state management.",
        content: "Run function components to retrieve children. Maintain an array of hook states on the current fiber. `useState(initial)` returns the current state and a setState action that schedules a new render pass.",
        codeSnippet: `function useState(initial) {\n  const oldHook = wipFiber.alternate?.hooks?.[hookIndex];\n  const hook = {\n    state: oldHook ? oldHook.state : initial,\n    queue: [],\n  };\n  const setState = action => {\n    hook.queue.push(action);\n    wipRoot = { dom: currentRoot.dom, props: currentRoot.props, alternate: currentRoot };\n    nextUnitOfWork = wipRoot;\n  };\n  wipFiber.hooks.push(hook);\n  hookIndex++;\n  return [hook.state, setState];\n}`,
        codeLanguage: "javascript",
        concepts: ["React hooks internals", "Closure state preservation", "Queue-based state dispatching"],
        referenceUrls: ["https://pomb.us/build-your-own-react/"],
        expectedResult: "An interactive button counter increments on click and re-renders smoothly."
      }
    ]
  },

  // 6. Build Your Own HTTP Web Server
  {
    slug: "build-your-own-http-server",
    title: "Build Your Own HTTP/1.1 Web Server from Sockets",
    categorySlug: "web-servers",
    language: "Node.js",
    languages: ["Node.js", "C", "Go"],
    difficulty: "Beginner",
    estimatedHours: 10,
    description: "Build an HTTP/1.1 web server from scratch using raw TCP network sockets, implementing request line parsing, headers, body streams, chunked encoding, and static file serving.",
    whatYouWillBuild: "A raw socket server (without `http` module or Express) that binds to port 8080, accepts TCP streams, decodes RFC 7230 HTTP request protocols, routes paths, serves static assets with proper MIME types, and responds with valid HTTP headers.",
    whyBuildThis: "Most web developers use Express, Next.js, or Fastify without ever seeing what an HTTP packet actually looks like on the wire. Writing a server using raw TCP sockets solidifies your understanding of the foundation of the World Wide Web.",
    realWorldApplications: "Web servers (Nginx, Caddy), API gateways, microservices, reverse proxies, and embedded IoT devices.",
    expectedOutcome: "A server capable of handling standard browser requests, curl commands, and concurrent static file downloads.",
    prerequisites: ["Basic Node.js or JavaScript knowledge", "Understanding of client-server models", "Familiarity with TCP/IP concepts"],
    technologies: ["Node.js `net` Module", "TCP Sockets", "HTTP/1.1 (RFC 7230)", "Buffer Manipulation", "MIME Types"],
    toolsRequired: ["Node.js 18+", "curl", "Any standard browser"],
    learningOutcomes: [
      "Understand TCP connection lifecycles (SYN, ACK, FIN) at the socket level",
      "Parse raw HTTP message formats: Request Line, Headers, CRLF delimiter, Body",
      "Implement content negotiation and proper Content-Type / Content-Length headers",
      "Prevent path traversal security vulnerabilities (e.g. `../../etc/passwd`)",
      "Support keep-alive persistent connections for multiple requests per socket"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "James Smith (build-your-own.org)",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: false,
    sortOrder: 6,
    resources: [
      {
        title: "Build Your Own Web Server from Scratch Tutorial",
        url: "https://build-your-own.org/webserver/",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "Step-by-step engineering tutorial covering socket handling and HTTP parsing.",
        author: "James Smith",
      },
      {
        title: "RFC 7230: Hypertext Transfer Protocol (HTTP/1.1) Specification",
        url: "https://datatracker.ietf.org/doc/html/rfc7230",
        resourceType: "SPECIFICATION",
        description: "Official Internet Engineering Task Force (IETF) specification for HTTP/1.1 message format.",
        author: "IETF",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Initialize the TCP Socket Listener",
        objective: "Create a raw TCP socket server using Node's `net` module listening on port 8080.",
        whyNecessary: "HTTP is an application-layer protocol running on top of reliable TCP byte streams.",
        content: "Use `net.createServer((socket) => { ... })`. Log client IP and port upon connection. Handle `data`, `error`, and `close` socket events.",
        codeSnippet: `const net = require("net");\n\nconst server = net.createServer((socket) => {\n  console.log("Client connected:", socket.remoteAddress);\n  socket.on("data", (chunk) => {\n    console.log("Received raw bytes:\\n", chunk.toString());\n  });\n});\nserver.listen(8080, () => console.log("TCP server listening on 8080"));`,
        codeLanguage: "javascript",
        concepts: ["TCP socket server", "Raw stream chunks", "Node.js net module"],
        referenceUrls: ["https://nodejs.org/api/net.html"],
        expectedResult: "Running 'curl http://localhost:8080' logs raw HTTP GET text in your terminal."
      },
      {
        stepNumber: 2,
        title: "Parse the Request Line & Header Dictionary",
        objective: "Parse `METHOD /path HTTP/1.1` and parse subsequent header lines into a key-value dictionary.",
        whyNecessary: "Headers dictate authentication, payload size, caching behavior, and connection persistence.",
        content: "Find the double CRLF boundary (`\\r\\n\\r\\n`) separating headers from body. Split header text by `\\r\\n`. Parse the first line into method, path, and version. Parse remaining lines by splitting on the first colon `: `.",
        codeSnippet: `function parseRequest(raw) {\n  const [headerSection, body] = raw.split("\\r\\n\\r\\n");\n  const lines = headerSection.split("\\r\\n");\n  const [method, path, version] = lines[0].split(" ");\n  const headers = {};\n  for (let i = 1; i < lines.length; i++) {\n    const [k, ...v] = lines[i].split(": ");\n    headers[k.toLowerCase()] = v.join(": ");\n  }\n  return { method, path, version, headers, body };\n}`,
        codeLanguage: "javascript",
        concepts: ["HTTP message structure", "CRLF boundary parsing", "Header normalization"],
        referenceUrls: ["https://datatracker.ietf.org/doc/html/rfc7230#section-3"],
        expectedResult: "Incoming requests are parsed into clean `{ method: 'GET', path: '/index.html', headers: {...} }` objects."
      },
      {
        stepNumber: 3,
        title: "Format and Send HTTP Responses",
        objective: "Construct valid HTTP response strings with Status Line, Content-Type, Content-Length, and body.",
        whyNecessary: "Browsers reject responses that violate HTTP framing rules or miscalculate Content-Length.",
        content: "Build helper function `sendResponse(socket, statusCode, statusText, headers, body)`. Ensure headers end with `\\r\\n\\r\\n` before the body bytes.",
        codeSnippet: `function sendResponse(socket, status, statusText, contentType, body) {\n  const payload = Buffer.from(body);\n  const responseHeader = [\n    \`HTTP/1.1 \${status} \${statusText}\`,\n    \`Content-Type: \${contentType}\`,\n    \`Content-Length: \${payload.length}\`,\n    "Connection: close",\n    "",\n    "",\n  ].join("\\r\\n");\n  socket.write(Buffer.concat([Buffer.from(responseHeader), payload]));\n  socket.end();\n}`,
        codeLanguage: "javascript",
        concepts: ["HTTP status codes", "Content-Length calculations", "Byte buffer encoding"],
        referenceUrls: ["https://datatracker.ietf.org/doc/html/rfc7230#section-3.1.2"],
        expectedResult: "Browser visiting `http://localhost:8080/` renders 'Hello from custom HTTP server!' with HTTP 200 OK."
      },
      {
        stepNumber: 4,
        title: "Static File Serving & Path Traversal Guard",
        objective: "Serve HTML, CSS, JS, and image files safely from a public directory while blocking directory traversal attacks.",
        whyNecessary: "Attackers can send `GET /../../etc/passwd` to exfiltrate private operating system files.",
        content: "Resolve target path using `path.resolve(PUBLIC_DIR, '.' + req.path)`. Verify `resolvedPath.startsWith(PUBLIC_DIR)`. Determine MIME types based on file extensions (.html -> text/html, .png -> image/png). Stream file bytes directly to the socket.",
        codeSnippet: `const safePath = path.normalize(path.join(PUBLIC_DIR, req.path));\nif (!safePath.startsWith(PUBLIC_DIR)) {\n  return sendResponse(socket, 403, "Forbidden", "text/plain", "Access Denied");\n}`,
        codeLanguage: "javascript",
        concepts: ["Directory traversal prevention", "MIME type resolution", "Static file streaming"],
        referenceUrls: ["https://owasp.org/www-community/attacks/Path_Traversal"],
        expectedResult: "Visiting `/logo.png` streams the image; requesting `/../package.json` correctly returns 403 Forbidden."
      }
    ]
  },

  // 7. Build Your Own Large Language Model
  {
    slug: "build-your-own-llm",
    title: "Build a Large Language Model from Scratch in Python",
    categorySlug: "ai-machine-learning",
    language: "Python",
    languages: ["Python"],
    difficulty: "Advanced",
    estimatedHours: 35,
    description: "Construct a complete GPT-like transformer language model from first principles: BPE tokenization, multi-head self-attention, layer normalization, residual connections, and autoregressive text generation.",
    whatYouWillBuild: "A PyTorch-based autoregressive transformer model capable of tokenizing text corpora, training on raw literature, calculating causal masked attention, and generating coherent text completions word-by-word.",
    whyBuildThis: "Modern AI is dominated by LLMs (ChatGPT, Gemini, Claude). Rather than calling external API endpoints, building the transformer architecture from scratch will teach you how attention mechanisms, positional encodings, and weight projections actually work mathematically.",
    realWorldApplications: "Generative AI applications, custom domain-specific language models, RAG vector embeddings, text classification, and deep learning research.",
    expectedOutcome: "A trained neural language model that consumes prompts and outputs generated continuations using temperature-scaled sampling.",
    prerequisites: ["Python proficiency", "Linear algebra (matrix multiplication, vectors)", "Basics of PyTorch and neural networks"],
    technologies: ["Python", "PyTorch", "Transformer Architecture", "Multi-Head Self-Attention", "Byte-Pair Encoding (BPE)"],
    toolsRequired: ["Python 3.10+", "PyTorch", "tiktoken (or custom tokenizer)"],
    learningOutcomes: [
      "Implement Byte-Pair Encoding (BPE) vocabulary tokenization",
      "Build causal scaled dot-product attention with future token masking",
      "Implement multi-head attention blocks with learned projection matrices",
      "Apply pre-layer normalization (LayerNorm) and GELU feedforward layers",
      "Implement autoregressive generation with top-k and temperature sampling"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "Sebastian Raschka (LLMs-from-scratch)",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: true,
    sortOrder: 7,
    resources: [
      {
        title: "LLMs from Scratch GitHub Repository & Book",
        url: "https://github.com/rasbt/LLMs-from-scratch",
        resourceType: "GITHUB_REPO",
        description: "Comprehensive step-by-step repository building a GPT-like LLM in PyTorch.",
        author: "Sebastian Raschka",
      },
      {
        title: "Attention Is All You Need (Original Transformer Paper)",
        url: "https://arxiv.org/abs/1706.03762",
        resourceType: "SPECIFICATION",
        description: "The seminal research paper introducing the transformer architecture.",
        author: "Vaswani et al.",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Text Tokenization & Positional Embeddings",
        objective: "Convert raw string corpora into discrete integer token sequences and add positional vector encodings.",
        whyNecessary: "Neural networks process numerical tensor matrices, not character strings. Positional embeddings encode the word order since attention is order-agnostic.",
        content: "Build a dataset loader that slides a context window over tokens. Map input tokens to d_model dimensional vectors using nn.Embedding. Add learned absolute positional embeddings.",
        codeSnippet: `class Embeddings(nn.Module):\n    def __init__(self, vocab_size, d_model, max_len):\n        super().__init__()\n        self.tok_emb = nn.Embedding(vocab_size, d_model)\n        self.pos_emb = nn.Embedding(max_len, d_model)\n    def forward(self, x):\n        seq_len = x.shape[1]\n        pos = torch.arange(seq_len, device=x.device)\n        return self.tok_emb(x) + self.pos_emb(pos)`,
        codeLanguage: "python",
        concepts: ["Tokenization", "Vector embeddings", "Positional encodings"],
        referenceUrls: ["https://github.com/rasbt/LLMs-from-scratch/blob/main/ch02/01_main-chapter-code/ch02.ipynb"],
        expectedResult: "Text 'Hello world' turns into tensors `[15496, 995]` with shape `[1, 2, 768]`."
      },
      {
        stepNumber: 2,
        title: "Causal Scaled Dot-Product Self-Attention",
        objective: "Implement the attention equation: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V with future masking.",
        whyNecessary: "Self-attention allows every token to query and weigh contextual information from preceding tokens while masking prevents looking ahead.",
        content: "Compute Queries, Keys, and Values through linear projection. Calculate attention score matrix. Apply an upper-triangular mask of negative infinity (-inf) before softmax.",
        codeSnippet: `def self_attention(Q, K, V, mask=None):\n    d_k = Q.size(-1)\n    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    weights = torch.softmax(scores, dim=-1)\n    return torch.matmul(weights, V)`,
        codeLanguage: "python",
        concepts: ["Scaled dot-product", "Causal masking", "Softmax probability distribution"],
        referenceUrls: ["https://github.com/rasbt/LLMs-from-scratch/blob/main/ch03/01_main-chapter-code/ch03.ipynb"],
        expectedResult: "Attention matrix shape `[seq_len, seq_len]` properly zeros out upper right probabilities."
      },
      {
        stepNumber: 3,
        title: "Multi-Head Attention & Transformer Block",
        objective: "Split embedding dimension across multiple attention heads and encapsulate inside a residual TransformerBlock.",
        whyNecessary: "Multiple heads allow the model to attend jointly to information from different representation subspaces (e.g. grammar vs semantics).",
        content: "Implement `MultiHeadAttention` with `num_heads`. Wrap with LayerNorm and FeedForward network (GELU activation) with residual skip connections (`x + sublayer(x)`).",
        codeSnippet: `class TransformerBlock(nn.Module):\n    def __init__(self, d_model, num_heads):\n        super().__init__()\n        self.ln1 = nn.LayerNorm(d_model)\n        self.attn = MultiHeadAttention(d_model, num_heads)\n        self.ln2 = nn.LayerNorm(d_model)\n        self.ffn = FeedForward(d_model)\n    def forward(self, x):\n        x = x + self.attn(self.ln1(x))\n        x = x + self.ffn(self.ln2(x))\n        return x`,
        codeLanguage: "python",
        concepts: ["Multi-head projection", "Residual connections", "Layer normalization", "GELU"],
        referenceUrls: ["https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/ch04.ipynb"],
        expectedResult: "Tensors flow through 12 stacked transformer blocks maintaining gradient stability."
      },
      {
        stepNumber: 4,
        title: "Autoregressive Text Generation & Sampling",
        objective: "Sample next tokens iteratively given a starting prompt using temperature and top-k filtering.",
        whyNecessary: "Raw argmax sampling produces repetitive and boring output; temperature-scaled sampling produces creative and natural completions.",
        content: "Predict logits for next token. Divide logits by `temperature`. Filter to top `k` candidates. Sample from resulting multinomial distribution and append to input sequence.",
        codeSnippet: `def generate_text(model, idx, max_new_tokens, temperature=0.8, top_k=50):\n    for _ in range(max_new_tokens):\n        logits = model(idx[:, -max_len:])[:, -1, :] / temperature\n        v, _ = torch.topk(logits, min(top_k, logits.size(-1)))\n        logits[logits < v[:, [-1]]] = -float('Inf')\n        probs = torch.softmax(logits, dim=-1)\n        idx_next = torch.multinomial(probs, num_samples=1)\n        idx = torch.cat((idx, idx_next), dim=1)\n    return idx`,
        codeLanguage: "python",
        concepts: ["Autoregressive decoding", "Temperature scaling", "Top-k sampling"],
        referenceUrls: ["https://github.com/rasbt/LLMs-from-scratch/blob/main/ch05/01_main-chapter-code/ch05.ipynb"],
        expectedResult: "Prompt 'In a distant galaxy' generates 50 coherent continuation tokens."
      }
    ]
  },

  // 8. Build Your Own Text Editor (Kilo Editor)
  {
    slug: "build-your-own-text-editor",
    title: "Build Your Own Text Editor in C (Kilo Clone)",
    categorySlug: "systems",
    language: "C",
    languages: ["C"],
    difficulty: "Intermediate",
    estimatedHours: 18,
    description: "Write your own terminal-based text editor in pure C with zero dependencies. Master VT100 escape codes, terminal raw mode, buffer management, scrolling, and syntax highlighting.",
    whatYouWillBuild: "A terminal text editor (`kilo`) in ~1000 lines of clean C that opens files, navigates with arrow keys, handles editing and backspacing, saves modifications, and colorizes syntax.",
    whyBuildThis: "Every developer uses text editors (VS Code, Vim, Nano) daily. Writing a terminal editor teaches low-level terminal POSIX termios control, VT100 escape sequences, and text buffer data structures.",
    realWorldApplications: "Terminal developer tools, embedded micro-controllers, system utilities, and console-based monitoring interfaces.",
    expectedOutcome: "A compiled C executable that can open any source code file in your terminal, edit text with full cursor control, and save changes to disk.",
    prerequisites: ["C programming fundamentals", "Familiarity with terminal usage", "Basic understanding of memory allocations"],
    technologies: ["C", "POSIX termios", "VT100 Escape Codes", "Dynamic Append Buffers", "File I/O"],
    toolsRequired: ["GCC or Clang", "Standard Linux / macOS terminal (or WSL2)"],
    learningOutcomes: [
      "Switch terminal between canonical and raw mode using POSIX termios",
      "Send VT100 escape sequences to clear screens and move the cursor",
      "Manage dynamic multi-line text buffers with row and column offsets",
      "Implement horizontal and vertical screen scrolling",
      "Add real-time syntax highlighting for C keywords and string literals"
    ],
    sourceRepo: "https://github.com/codecrafters-io/build-your-own-x",
    sourceAuthor: "Jeremy Ruten / Salvatore Sanfilippo",
    sourceLicense: "CC0-1.0",
    isPublished: true,
    isFeatured: false,
    sortOrder: 8,
    resources: [
      {
        title: "Build Your Own Text Editor (Snaptoken Tutorial)",
        url: "https://viewsourcecode.org/snaptoken/kilo/",
        resourceType: "ORIGINAL_TUTORIAL",
        description: "The celebrated 184-step tutorial teaching how to build the Kilo editor in C.",
        author: "Jeremy Ruten",
      },
      {
        title: "Salvatore Sanfilippo's Original Kilo Repository",
        url: "https://github.com/antirez/kilo",
        resourceType: "GITHUB_REPO",
        description: "The original 1000-line C text editor created by the author of Redis.",
        author: "Salvatore Sanfilippo",
      }
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Enter Terminal Raw Mode",
        objective: "Disable canonical mode and echo so keypresses are read immediately byte-by-byte without waiting for Enter.",
        whyNecessary: "By default, terminals wait for the Enter key before sending input to the program, which is incompatible with interactive text editors.",
        content: "Use `tcgetattr` and `tcsetattr` from `<termios.h>`. Disable `ECHO`, `ICANON`, `ISIG`, and `IXON` flags. Register `disableRawMode()` via `atexit()` to ensure the terminal resets on exit.",
        codeSnippet: `void enableRawMode() {\n  tcgetattr(STDIN_FILENO, &orig_termios);\n  atexit(disableRawMode);\n  struct termios raw = orig_termios;\n  raw.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);\n  raw.c_lflag &= ~(ECHO | ICANON | IEXTEN | ISIG);\n  tcsetattr(STDIN_FILENO, TCSAFLUSH, &raw);\n}`,
        codeLanguage: "c",
        concepts: ["POSIX termios", "Terminal raw mode", "atexit cleanup handlers"],
        referenceUrls: ["https://viewsourcecode.org/snaptoken/kilo/02.enteringRawMode.html"],
        expectedResult: "Pressing keys prints their ASCII values immediately without echoing or waiting for Enter."
      },
      {
        stepNumber: 2,
        title: "Clear Screen & Position Cursor with Escape Sequences",
        objective: "Use standard VT100 escape sequences to clear the screen and draw the tilde '~' margin.",
        whyNecessary: "Escape sequences allow programs to control colors, clear screens, and position cursors across all standard terminals.",
        content: "Write `\\x1b[2J` to clear the screen, and `\\x1b[H` to move the cursor to row 1, col 1. Draw a column of tildes (`~`) on empty rows just like Vim.",
        codeSnippet: `void editorRefreshScreen() {\n  struct abuf ab = ABUF_INIT;\n  abAppend(&ab, "\\x1b[?25l", 6); // Hide cursor\n  abAppend(&ab, "\\x1b[H", 3);    // Reposition cursor\n  editorDrawRows(&ab);\n  abAppend(&ab, "\\x1b[?25h", 6); // Show cursor\n  write(STDOUT_FILENO, ab.b, ab.len);\n  abFree(&ab);\n}`,
        codeLanguage: "c",
        concepts: ["VT100 escape codes", "Append buffer optimization", "Screen redrawing"],
        referenceUrls: ["https://viewsourcecode.org/snaptoken/kilo/03.rawInputAndOutput.html"],
        expectedResult: "Terminal clears completely and displays a Vim-like '~' gutter."
      },
      {
        stepNumber: 3,
        title: "Row Representation & File Loading",
        objective: "Read text files from disk into an array of `erow` structs containing string characters and rendered tabs.",
        whyNecessary: "The editor must hold all file rows in memory to enable scrolling and modification.",
        content: "Implement `editorOpen(char *filename)`. Use `getline()` in a loop to read lines into `E.row[E.numrows]`. Convert tab characters (`\\t`) into spaces for consistent rendering.",
        codeSnippet: `typedef struct erow {\n  int size;\n  int rsize;\n  char *chars;\n  char *render;\n} erow;`,
        codeLanguage: "c",
        concepts: ["File reading", "Dynamic row arrays", "Tab character rendering"],
        referenceUrls: ["https://viewsourcecode.org/snaptoken/kilo/04.aTextViewer.html"],
        expectedResult: "'./kilo main.c' loads and displays the source code cleanly."
      },
      {
        stepNumber: 4,
        title: "Arrow Key Navigation & Screen Scrolling",
        objective: "Parse multi-byte arrow escape sequences ('\\x1b[A', etc.) and scroll when the cursor moves off screen.",
        whyNecessary: "Files are typically longer than the terminal window height and wider than its width.",
        content: "Maintain `rowoff` and `coloff` offsets. If cursor row `E.cy` < `E.rowoff`, scroll up; if `E.cy` >= `E.rowoff + E.screenrows`, scroll down.",
        codeSnippet: `void editorScroll() {\n  if (E.cy < E.rowoff) E.rowoff = E.cy;\n  if (E.cy >= E.rowoff + E.screenrows) E.rowoff = E.cy - E.screenrows + 1;\n}`,
        codeLanguage: "c",
        concepts: ["Scrolling calculations", "Arrow key escape sequence parsing", "Viewport boundaries"],
        referenceUrls: ["https://viewsourcecode.org/snaptoken/kilo/04.aTextViewer.html#scroll"],
        expectedResult: "Navigating with arrow keys smoothly scrolls through thousand-line files."
      },
      {
        stepNumber: 5,
        title: "Text Editing & File Saving",
        objective: "Implement character insertion, backspace deletion, and save changes back to disk with Ctrl-S.",
        whyNecessary: "An editor must allow interactive modifications and persist work to storage.",
        content: "On standard character input, call `editorRowInsertChar()`. On backspace, shift trailing characters left. On Ctrl-S, write the buffer to disk using `open()` with `O_RDWR | O_CREAT`.",
        codeSnippet: `void editorSave() {\n  int len;\n  char *buf = editorRowsToString(&len);\n  int fd = open(E.filename, O_RDWR | O_CREAT, 0644);\n  ftruncate(fd, len);\n  write(fd, buf, len);\n  close(fd);\n  free(buf);\n}`,
        codeLanguage: "c",
        concepts: ["Buffer mutation", "POSIX file truncation", "Save protocols"],
        referenceUrls: ["https://viewsourcecode.org/snaptoken/kilo/05.aTextEditor.html"],
        expectedResult: "Typing inserts letters at cursor position; pressing Ctrl-S saves the updated file."
      }
    ]
  }
];

async function seedProjectTutorials() {
  console.log("Starting Project-Building Tutorials database seeding...");

  // 1. Seed Categories
  for (const cat of categoriesData) {
    await prisma.projectTutorialCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log(`Successfully seeded ${categoriesData.length} tutorial categories.`);

  // 2. Seed Tutorials, Steps & Resources
  for (const tut of tutorialsData) {
    const category = await prisma.projectTutorialCategory.findUnique({
      where: { slug: tut.categorySlug },
    });

    const createdTutorial = await prisma.projectTutorial.upsert({
      where: { slug: tut.slug },
      update: {
        title: tut.title,
        description: tut.description,
        categorySlug: tut.categorySlug,
        categoryId: category ? category.id : null,
        language: tut.language,
        languages: tut.languages,
        difficulty: tut.difficulty,
        estimatedHours: tut.estimatedHours,
        whatYouWillBuild: tut.whatYouWillBuild,
        whyBuildThis: tut.whyBuildThis,
        realWorldApplications: tut.realWorldApplications,
        expectedOutcome: tut.expectedOutcome,
        prerequisites: tut.prerequisites,
        technologies: tut.technologies,
        toolsRequired: tut.toolsRequired,
        learningOutcomes: tut.learningOutcomes,
        sourceRepo: tut.sourceRepo,
        sourceAuthor: tut.sourceAuthor,
        sourceLicense: tut.sourceLicense,
        isPublished: tut.isPublished,
        isFeatured: tut.isFeatured,
        sortOrder: tut.sortOrder,
      },
      create: {
        slug: tut.slug,
        title: tut.title,
        description: tut.description,
        categorySlug: tut.categorySlug,
        categoryId: category ? category.id : null,
        language: tut.language,
        languages: tut.languages,
        difficulty: tut.difficulty,
        estimatedHours: tut.estimatedHours,
        whatYouWillBuild: tut.whatYouWillBuild,
        whyBuildThis: tut.whyBuildThis,
        realWorldApplications: tut.realWorldApplications,
        expectedOutcome: tut.expectedOutcome,
        prerequisites: tut.prerequisites,
        technologies: tut.technologies,
        toolsRequired: tut.toolsRequired,
        learningOutcomes: tut.learningOutcomes,
        sourceRepo: tut.sourceRepo,
        sourceAuthor: tut.sourceAuthor,
        sourceLicense: tut.sourceLicense,
        isPublished: tut.isPublished,
        isFeatured: tut.isFeatured,
        sortOrder: tut.sortOrder,
      },
    });

    // Delete existing resources and steps to ensure clean idempotent overwrite
    await prisma.projectResource.deleteMany({
      where: { projectTutorialId: createdTutorial.id },
    });
    await prisma.projectStep.deleteMany({
      where: { projectTutorialId: createdTutorial.id },
    });

    // Insert Resources
    if (tut.resources && tut.resources.length > 0) {
      await prisma.projectResource.createMany({
        data: tut.resources.map((r, idx) => ({
          projectTutorialId: createdTutorial.id,
          title: r.title,
          url: r.url,
          resourceType: r.resourceType || "ORIGINAL_TUTORIAL",
          description: r.description,
          author: r.author,
          isVerified: true,
          sortOrder: idx + 1,
        })),
      });
    }

    // Insert Steps
    if (tut.steps && tut.steps.length > 0) {
      await prisma.projectStep.createMany({
        data: tut.steps.map((s) => ({
          projectTutorialId: createdTutorial.id,
          stepNumber: s.stepNumber,
          title: s.title,
          objective: s.objective,
          whyNecessary: s.whyNecessary,
          content: s.content,
          codeSnippet: s.codeSnippet || null,
          codeLanguage: s.codeLanguage || tut.language.toLowerCase(),
          concepts: s.concepts || [],
          referenceUrls: s.referenceUrls || [],
          expectedResult: s.expectedResult || null,
        })),
      });
    }

    console.log(`Seeded tutorial: ${tut.title} with ${tut.steps.length} steps and ${tut.resources.length} resources.`);
  }

  console.log("Project-Building Tutorials database seeding completed successfully!");
}

if (require.main === module) {
  seedProjectTutorials()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}

module.exports = { seedProjectTutorials };
