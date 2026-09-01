import { useEffect, useState, type MouseEvent } from 'react';

type IconName =
  | 'arrow'
  | 'download'
  | 'github'
  | 'linkedin'
  | 'mail'
  | 'medium'
  | 'spark';

const profiles = {
  github: 'https://github.com/xzaviourr',
  linkedin: 'https://www.linkedin.com/in/anshul-sanghi',
  medium: 'https://medium.com/@anshul.sanghi',
};

const experience = [
  {
    company: 'Microsoft',
    role: 'Software Engineer',
    period: 'Jul 2024 — Present',
    team: 'Customer Experience · Microsoft Security',
    color: 'blue',
    points: [
      'Spearheaded Prompt Playground, an MCP Server, and a Copilot Agent—driving 7,500+ AI insights API hits.',
      'Built scalable .NET APIs and React visual dashboards for complex customer intelligence.',
      'Migrated Synapse DB workloads to Kusto DB, cutting API response time by 50% and failure rates below 10%.',
      'Built the context pipeline for an NL2KQL agent and expanded its prompt library to 20+ scenarios.',
      'Improved application insights, caching, and AI-generated customer reports used by product managers.',
    ],
  },
  {
    company: 'Paytm',
    role: 'Software Developer Trainee',
    period: 'Jan 2022 — May 2022',
    team: 'Mapping Service · Payment Gateway',
    color: 'cyan',
    points: [
      'Implemented feature flags to switch database caching mechanisms across mapping service APIs.',
      'Worked cross-functionally to identify and optimize feature flags throughout the codebase.',
      'Trained across Java, Spring Boot, Jenkins, Kibana, and canary server deployments.',
    ],
  },
  {
    company: 'Analytics Valley',
    role: 'SDE Intern · Python Intern',
    period: 'May 2019 — Jul 2021',
    team: 'Nissan R&D · Subarban Diagnostics',
    color: 'yellow',
    points: [
      'Built a real-time Mask R-CNN nanoparticle segmentation app with nearly 80% initial accuracy.',
      'Developed a CNN U-Net photo-emission spectra denoiser that improved impurity detection by 15%.',
      'Engineered an Android push notification service with multi-level, multi-priority thread-pool queues.',
    ],
  },
];

const projects = [
  {
    number: '01',
    label: 'Collaborative AI',
    title: 'Agentic Movie Generation Pipeline',
    period: 'Apr — Aug 2026',
    description:
      'A LangGraph-powered film studio that transforms screenplays into cinema-quality generated video.',
    tags: ['LangGraph', 'Generative Video', 'LLM Evals', 'Langfuse'],
    details:
      'Automates characters, locations, shot decomposition, camera planning, and cinematic styles—with observability-led prompt optimization plus self-validation and regeneration loops.',
    accent: 'pink',
  },
  {
    number: '02',
    label: 'Personal Agentic AI',
    title: 'Market Intelligence & Trading Platform',
    period: 'Mar — Apr 2026',
    description:
      'A desk of persona-driven hedge-fund agents that debate signals before making a trade.',
    tags: ['Multi-agent', 'Market Data', 'NSE / BSE', 'React'],
    details:
      'Unifies market data, news, forums, and Reddit intelligence across long-term and intraday workflows, with a UI tracing discussions, rationale, and execution.',
    accent: 'green',
  },
  {
    number: '03',
    label: 'M.Tech Thesis',
    title: 'GPU Resource Virtualization in Kubernetes',
    period: 'Jun 2023 — Jun 2024',
    description:
      'Independent control of GPU memory and compute to make accelerator scheduling more flexible.',
    tags: ['Kubernetes', 'GPU', 'Device Plugin', 'Scheduling'],
    details:
      'Profiled HPC, math, and ML workloads, demonstrated equivalent-performance configurations, and extended the scheduler to filter efficient compute-memory pairings.',
    accent: 'purple',
  },
  {
    number: '04',
    label: 'B.Tech Capstone',
    title: 'Healthcare Diagnosis Assistant',
    period: 'Jan — May 2022',
    description:
      'A knowledge-graph medical chatbot that narrows possible diseases from symptoms and age.',
    tags: ['Knowledge Graph', 'NLP', 'Android', 'ML'],
    details:
      'Combined text-similarity models and disease attributes inside a friendly Android experience designed to make diagnostic guidance more accessible.',
    accent: 'orange',
  },
];

const labProjects = [
  {
    title: 'Containerization from Scratch',
    text: 'Recreated Docker-like isolation with cgroups, namespaces, and chroot.',
    icon: '📦',
  },
  {
    title: 'Ethereum Lightning Network',
    text: 'Built Solidity payment channels and simulated selfish and stubborn mining.',
    icon: '⚡',
  },
  {
    title: 'Correlation-aware Stock Predictor',
    text: 'Compared cross-sector generalized LSTM features with stock-specific models.',
    icon: '📈',
  },
  {
    title: 'Intruder-detection Honeypot',
    text: 'Trapped and studied attackers in a virtual filesystem inside Docker.',
    icon: '🍯',
  },
  {
    title: 'GPU Multiplexing Seminar',
    text: 'Studied NVIDIA and open-source GPU virtualization and scheduling techniques.',
    icon: '🧩',
  },
];

const skills = [
  {
    title: 'Languages',
    icon: '{ }',
    items: ['C#', 'Python', 'C++', 'C', 'Bash', 'SQL', 'KQL'],
    color: 'blue',
  },
  {
    title: 'Agentic AI',
    icon: '✦',
    items: ['LangGraph', 'AutoGen', 'MCP', 'Azure AI SDK', 'Prompt Engineering', 'LLM Evals'],
    color: 'pink',
  },
  {
    title: 'Full Stack',
    icon: '◫',
    items: ['ASP.NET Core', 'React', 'REST APIs', 'Flask', 'Selenium'],
    color: 'yellow',
  },
  {
    title: 'Cloud & Systems',
    icon: '☁',
    items: ['Azure', 'AWS', 'Kubernetes', 'Docker', 'Langfuse', 'Linux', 'Git'],
    color: 'green',
  },
];

const achievements = [
  ['🏆', 'Microsoft Security Hackathon Winner', 'AI-generated customer reports · 2025'],
  ['#10', 'GATE All India Rank 10', 'Plus AIR 206 among 100,000+ candidates · 2021–22'],
  ['#17', 'Google Hash Code AIR 17', 'Global rank 267 among 10,000+ teams · 2022'],
  ['1887', 'CodeChef Rating', 'Global ranks 44, 171, 291, 322 & 357 · 2020–22'],
  ['🌍', 'International Math Olympiad', 'Global ranks 85, 203 & 332 · 2014–17'],
  ['🥇', 'Chhattisgarh State Topper', 'National Science Talent Search Examination · 2017'],
  ['#11021', 'JEE Mains AIR', 'Among more than one million candidates · 2018'],
  ['★', 'Club Leaderboard Topper', 'Outperformed peers across year-long events · 2019'],
];

const leadership = [
  ['2026', 'AI Instructor', 'Microsoft’s fresher cohort across the security domain'],
  ['2025', 'Lead Trainer', 'CXE team offsite on AI for customer interactions'],
  ['2025', 'Cloud Instructor', 'Two-day workshop for 40+ students at RV College, Bangalore'],
  ['2022–24', 'Teaching Assistant', 'Operating Systems, Software Systems, and Computer Programming at IIT Bombay'],
  ['2020', 'Project Mentor', 'Guided 15+ juniors building an intra-network torrent'],
  ['2019', 'Design Volunteer', 'Annual techno-managerial fest Infotsav'],
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    download: <path d="M12 3v12m-4-4 4 4 4-4M5 20h14" />,
    github: (
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.2-.4 6.5-1.6 6.5-7A5.5 5.5 0 0 0 19 3.7 5 5 0 0 0 18.9 0S17.7-.4 15 1.5a13.4 13.4 0 0 0-7 0C5.3-.4 4.1 0 4.1 0A5 5 0 0 0 4 3.7a5.5 5.5 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.5 7A4.8 4.8 0 0 0 8 18v4m0-3c-3 .9-3-1.5-4-2" />
    ),
    linkedin: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2" />
        <path d="M2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    medium: (
      <>
        <path d="M2 6.5 7.2 4l6.6 14H8.4z" />
        <path d="M15.3 6.2h4.8v11.6h-4.8z" />
        <path d="m20.1 6.2 1.9-2v15.6l-1.9-2" />
      </>
    ),
    spark: <path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function CompanyLogo({ company }: { company: string }) {
  if (company === 'Microsoft') {
    return (
      <div className="job-logo job-logo--microsoft" aria-label="Microsoft logo">
        <span className="microsoft-symbol">
          <i /><i /><i /><i />
        </span>
        <span className="microsoft-word">Microsoft</span>
      </div>
    );
  }

  if (company === 'Paytm') {
    return (
      <div className="job-logo job-logo--paytm" aria-label="Paytm logo">
        <span>pay</span><strong>tm</strong>
      </div>
    );
  }

  return (
    <div className="job-logo job-logo--analytics" aria-label="Analytics Valley logo">
      <img src="/analytics-valley.svg" alt="" />
      <span><strong>analytics</strong>valley</span>
    </div>
  );
}

function LabIllustration() {
  return (
    <div className="hero-art" aria-label="Cartoon illustration of Anshul building an AI system">
      <div className="orbit orbit-one"><span>AI</span></div>
      <div className="orbit orbit-two"><span>&lt;/&gt;</span></div>
      <div className="idea-bubble">ship it! <span>✦</span></div>
      <div className="milestone-badge milestone-badge--iitb">
        <span className="milestone-institute-mark">
          <img src="/iit-bombay-logo.svg" alt="" />
        </span>
        <strong>IIT Bombay</strong>
      </div>
      <div className="milestone-badge milestone-badge--microsoft">
        <span className="milestone-microsoft-mark"><i /><i /><i /><i /></span>
        <strong>Microsoft</strong>
      </div>
      <div className="milestone-badge milestone-badge--paytm">
        <strong><span>pay</span>tm</strong>
      </div>
      <div className="milestone-badge milestone-badge--iiit">
        <span className="milestone-institute-mark">
          <img src="/iiit-gwalior-logo.png" alt="" />
        </span>
        <strong>IIIT Gwalior</strong>
      </div>
      <svg className="lab-svg" viewBox="0 0 620 520" role="img">
        <title>Anshul's animated idea reactor</title>
        <path className="blob" d="M104 419C25 342 47 180 143 88 241-5 421 8 512 109c90 101 75 258-24 331-101 74-309 55-384-21Z" />
        <g className="reactor-orbit reactor-orbit--wide">
          <ellipse cx="312" cy="254" rx="238" ry="111" />
          <circle className="reactor-node reactor-node--pink" cx="74" cy="254" r="14" />
          <circle className="reactor-node reactor-node--green" cx="550" cy="254" r="11" />
        </g>
        <g className="reactor-orbit reactor-orbit--tall">
          <ellipse cx="312" cy="254" rx="116" ry="207" />
          <circle className="reactor-node reactor-node--yellow" cx="312" cy="47" r="12" />
          <circle className="reactor-node reactor-node--blue" cx="312" cy="461" r="10" />
        </g>
        <circle className="reactor-halo reactor-halo--outer" cx="312" cy="254" r="148" />
        <circle className="reactor-halo reactor-halo--inner" cx="312" cy="254" r="120" />
        <circle className="reactor-core-shadow" cx="323" cy="266" r="91" />
        <circle className="reactor-core" cx="312" cy="254" r="91" />
        <path className="reactor-shine" d="M264 188c23-20 57-29 88-15" />
        <text className="reactor-monogram" x="312" y="267" textAnchor="middle">AS</text>
        <circle className="reactor-dot" cx="376" cy="279" r="8" />
        <g className="reactor-status">
          <rect x="248" y="302" width="128" height="27" rx="13.5" />
          <circle cx="266" cy="315.5" r="5" />
          <text x="279" y="319">ANSHUL.OS</text>
        </g>
        <g className="reactor-command">
          <rect x="146" y="385" width="332" height="64" rx="16" />
          <circle className="code-dot code-dot--pink" cx="169" cy="405" r="4" />
          <circle className="code-dot code-dot--yellow" cx="183" cy="405" r="4" />
          <circle className="code-dot code-dot--green" cx="197" cy="405" r="4" />
          <text x="312" y="425" textAnchor="middle">BUILD  →  LEARN  →  SHIP</text>
        </g>
        <path className="reactor-spark reactor-spark--one" d="m118 149 12 11-8 14 19-4 10 13" />
        <path className="reactor-spark reactor-spark--two" d="m477 332 13-7 10 12 8-18 15-2" />
        <path className="reactor-spark reactor-spark--three" d="m459 118 7 13 15-4-4 16 13 8" />
      </svg>
      <div className="art-caption">
        <span className="caption-dot" />
        currently building with agents
      </div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const revealInView = () => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
          element.classList.add('is-visible');
        }
      });
    };
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      revealInView();
    };

    revealInView();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const trackPointer = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--mouse-x', `${event.clientX}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${event.clientY}px`);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <main onMouseMove={trackPointer}>
      <div className="cursor-glow" />
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <a className="logo" href="#top" aria-label="Anshul Sanghi home" onClick={closeMenu}>
          AS<span>.</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#work" onClick={closeMenu}>Work</a>
          <a href="#projects" onClick={closeMenu}>Projects</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
          <a className="nav-resume" href="/Anshul-Sanghi-Resume.pdf" target="_blank" rel="noreferrer">
            Résumé <Icon name="arrow" />
          </a>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-doodle hero-doodle--one">✦</div>
        <div className="hero-doodle hero-doodle--two">⌁</div>
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-icon"><Icon name="spark" /></span>
            Hello, world! I’m Anshul.
          </div>
          <h1>
            <span className="hero-line">I make</span>
            <span className="hero-line">
              machines{' '}<span className="hero-word">think<span className="word-ring" /></span>
            </span>
            <span className="hero-line">& systems</span>
            <span className="hero-line"><span className="scribble">scale.</span></span>
          </h1>
          <p className="hero-lede">
            Software Engineer at <strong>Microsoft</strong>, agentic AI tinkerer, and systems nerd
            turning ambitious ideas into delightful, production-ready experiences.
          </p>
          <div className="hero-actions">
            <a className="button button--dark" href="#projects">
              Explore my work <Icon name="arrow" />
            </a>
            <a className="text-link" href="mailto:anshul.sanghi.personal@gmail.com">
              <Icon name="mail" /> Let’s talk
            </a>
          </div>
          <div className="hero-socials">
            <span>Find me in the wild</span>
            <a href={profiles.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Icon name="linkedin" /></a>
            <a href={profiles.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github" /></a>
            <a href={profiles.medium} target="_blank" rel="noreferrer" aria-label="Medium"><Icon name="medium" /></a>
          </div>
        </div>
        <LabIllustration />
      </header>

      <section className="signal-board" aria-label="Anshul's achievement highlights">
        <div className="signal-board__label">
          <span className="caption-dot" />
          high scores from the builder’s lab
        </div>
        <svg className="signal-path" viewBox="0 0 1200 130" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 72c113-58 205 64 318 10S533 40 627 83s188 39 274-6 179-34 281 8" />
        </svg>
        <div className="signal-chip signal-chip--ai">
          <span>01</span><strong>Winner</strong><small>Microsoft Security Hackathon</small>
        </div>
        <div className="signal-chip signal-chip--fullstack">
          <span>02</span><strong>AIR 10</strong><small>GATE CS · among 100K+</small>
        </div>
        <div className="signal-chip signal-chip--cloud">
          <span>03</span><strong>AIR 17</strong><small>Google Hash Code · 10K+ teams</small>
        </div>
        <div className="signal-chip signal-chip--ideas">
          <span>04</span><strong>1887</strong><small>CodeChef · Global Rank 44 peak</small>
        </div>
        <div className="signal-chip signal-chip--olympiad">
          <span>05</span><strong>Global #85</strong><small>International Math Olympiad</small>
        </div>
      </section>

      <section className="about section" id="about">
        <div className="section-kicker reveal">01 · The origin story</div>
        <div className="about-grid">
          <div className="section-heading reveal">
            <h2>Engineer by training.<br /><em>Explorer</em> by default.</h2>
          </div>
          <div className="about-copy reveal">
            <p className="lead">
              I’m a computer scientist who likes working where <strong>AI, distributed systems,
              and human-friendly design</strong> overlap.
            </p>
            <p>
              At Microsoft Security, I build AI-powered products that make enormous datasets useful.
              Before that, I explored payment infrastructure at Paytm, computer vision for Nissan
              R&D, and resource-efficient GPU scheduling during my M.Tech at IIT Bombay.
            </p>
            <p>
              Away from the terminal, I teach, sketch, paint, fold origami, play basketball, and
              occasionally remember the French I studied for three years.
            </p>
            <a className="inline-link" href="/Anshul-Sanghi-Resume.pdf" target="_blank" rel="noreferrer">
              The full story, on paper <Icon name="download" />
            </a>
          </div>
        </div>
        <div className="stats-grid reveal">
          <div className="stat stat--blue"><strong>7.5K+</strong><span>AI insight API hits</span><small>production impact</small></div>
          <div className="stat stat--pink"><strong>50%</strong><span>faster API responses</span><small>after Kusto migration</small></div>
          <div className="stat stat--yellow"><strong>20+</strong><span>NL2KQL scenarios</span><small>in the prompt library</small></div>
          <div className="stat stat--green"><strong>AIR 10</strong><span>in GATE CS</span><small>among 100K+ candidates</small></div>
        </div>
      </section>

      <section className="work section" id="work">
        <div className="section-title-row reveal">
          <div>
            <div className="section-kicker">02 · Where I’ve shipped</div>
            <h2>Work, with <span className="highlight">real impact.</span></h2>
          </div>
          <div className="sticker">4+ years<br />of building</div>
        </div>
        <div className="timeline">
          {experience.map((job, index) => (
            <article className={`job reveal job--${job.color}`} key={job.company}>
              <div className="job-index">0{index + 1}</div>
              <div className="job-meta">
                <span>{job.period}</span>
                <CompanyLogo company={job.company} />
              </div>
              <div className="job-content">
                <p>{job.team}</p>
                <h3>{job.role}</h3>
                <ul>
                  {job.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="projects section" id="projects">
        <div className="projects-intro reveal">
          <div className="section-kicker">03 · Selected experiments</div>
          <h2>Things I’ve brought<br /><span>to life.</span></h2>
          <p>Agents, infrastructure, research, and a healthy disregard for “that sounds difficult.”</p>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <article className={`project-card project-card--${project.accent} reveal`} key={project.title}>
              <div className="project-top">
                <span className="project-number">{project.number}</span>
                <span className="project-period">{project.period}</span>
              </div>
              <div className="project-label">{project.label}</div>
              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-tags">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="project-details">{project.details}</div>
              <div className="project-arrow"><Icon name="arrow" /></div>
            </article>
          ))}
        </div>
        <div className="mini-lab">
          <div className="mini-lab-heading reveal">
            <span>Also from the lab</span>
            <p>Academic builds, research rabbit holes, and security experiments.</p>
          </div>
          <div className="mini-grid">
            {labProjects.map((project) => (
              <article className="mini-card reveal" key={project.title}>
                <div className="mini-icon">{project.icon}</div>
                <h3>{project.title}</h3>
                <p>{project.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="skills section">
        <div className="section-title-row reveal">
          <div>
            <div className="section-kicker">04 · The toolkit</div>
            <h2>Powered by curiosity.<br />Built with <span className="circle-word">these.</span></h2>
          </div>
          <p className="heading-aside">From prompt graphs to kernel primitives—I like understanding the whole stack.</p>
        </div>
        <div className="skill-grid">
          {skills.map((skill) => (
            <article className={`skill-card skill-card--${skill.color} reveal`} key={skill.title}>
              <div className="skill-icon">{skill.icon}</div>
              <h3>{skill.title}</h3>
              <div className="skill-tags">
                {skill.items.map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="education section">
        <div className="education-panel reveal">
          <div className="education-intro">
            <div className="section-kicker">05 · Training arc</div>
            <h2>Deep roots<br />in computer<br />science.</h2>
            <p>Systems, algorithms, ML, blockchains, cloud computing—and a lot of whiteboard ink.</p>
          </div>
          <div className="degree-list">
            <article>
              <div className="degree-year">2024</div>
              <div><span>M.Tech · Computer Science</span><h3>Indian Institute of Technology Bombay</h3><p>CPI 8.81 · GPU resource management & virtualization</p></div>
              <div className="degree-logo">
                <img src="/iit-bombay-logo.svg" alt="" />
              </div>
            </article>
            <article>
              <div className="degree-year">2022</div>
              <div><span>B.Tech · Computer Science</span><h3>IIIT Gwalior</h3><p>CPI 8.42 · Healthcare AI capstone</p></div>
              <div className="degree-logo">
                <img src="/iiit-gwalior-logo.png" alt="" />
              </div>
            </article>
            <article>
              <div className="degree-year">2018</div>
              <div><span>CBSE · Intermediate</span><h3>Delhi Public School, Durg</h3><p>92.4%</p></div>
              <div className="degree-logo degree-logo--dps">
                <img src="/dps-durg-logo.png" alt="" />
              </div>
            </article>
          </div>
        </div>
        <div className="course-strip reveal">
          <span>Favourite coursework</span>
          <p>Computing Systems · GPU Virtualization · Cloud Computing · Blockchains · Machine Learning · Algorithms & Complexity</p>
        </div>
      </section>

      <section className="achievements section">
        <div className="section-title-row reveal">
          <div>
            <div className="section-kicker">06 · Side quests completed</div>
            <h2>A few shiny<br /><span className="highlight highlight--yellow">badges.</span></h2>
          </div>
          <div className="certificate-note">Microsoft Azure AI Fundamentals · 2025<br />Machine Learning Foundations, UW · 2020</div>
        </div>
        <div className="achievement-grid">
          {achievements.map(([score, title, detail]) => (
            <article className="achievement-card reveal" key={title}>
              <strong>{score}</strong>
              <div><h3>{title}</h3><p>{detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="leadership section">
        <div className="leadership-grid">
          <div className="leadership-copy reveal">
            <div className="section-kicker">07 · Pass it forward</div>
            <h2>I learn.<br />I build.<br /><span>I teach.</span></h2>
            <p>
              The best knowledge compounds when it’s shared. I’ve taught new engineers, college
              cohorts, and curious learners—making hard ideas feel approachable.
            </p>
          </div>
          <div className="leadership-list">
            {leadership.map(([year, title, detail]) => (
              <article className="leadership-item reveal" key={`${year}-${title}`}>
                <span>{year}</span>
                <div><h3>{title}</h3><p>{detail}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="writing section">
        <div className="writing-card reveal">
          <div className="writing-stamp">From<br />Medium</div>
          <div className="writing-copy">
            <span>Field notes · 12 min read</span>
            <h2>How I secured AIR 10 & AIR 206 in two consecutive GATE attempts.</h2>
            <p>A detailed, honest guide to self-study, strategy, and learning from the first attempt.</p>
            <a href="https://medium.com/@anshul.sanghi/gate-preparation-tips-how-i-secured-air-10-and-air-206-in-my-two-consecutive-attempts-of-gate-7613417f3c7f" target="_blank" rel="noreferrer">
              Read the story <Icon name="arrow" />
            </a>
          </div>
          <div className="writing-art">Aa<span>✎</span></div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="contact-stars">✦ <span>✦</span></div>
        <div className="contact-copy reveal">
          <div className="section-kicker">08 · Open a channel</div>
          <h2>Have a wild idea?<br /><span>Let’s make it real.</span></h2>
          <p>
            I’m always up for conversations about agentic AI, ambitious engineering, teaching,
            or a project that sounds just a little impossible.
          </p>
          <a className="button button--pink" href="mailto:anshul.sanghi.personal@gmail.com">
            Say hello <Icon name="mail" />
          </a>
          <a className="contact-email" href="mailto:anshul.sanghi.personal@gmail.com">
            anshul.sanghi.personal@gmail.com
          </a>
        </div>
        <div className="contact-card reveal">
          <div className="contact-avatar">
            <img src="https://github.com/xzaviourr.png" alt="Anshul Sanghi" />
            <span />
          </div>
          <h3>Anshul Sanghi</h3>
          <p>Software Engineer · AI Builder · Teacher</p>
          <div className="contact-location">Bengaluru, India <span>IST · UTC+5:30</span></div>
          <div className="contact-links">
            <a href={profiles.linkedin} target="_blank" rel="noreferrer"><Icon name="linkedin" /> LinkedIn</a>
            <a href={profiles.github} target="_blank" rel="noreferrer"><Icon name="github" /> GitHub</a>
            <a href={profiles.medium} target="_blank" rel="noreferrer"><Icon name="medium" /> Medium</a>
          </div>
        </div>
      </section>

      <footer>
        <a className="logo logo--footer" href="#top">AS<span>.</span></a>
        <p>Designed & built with curiosity, caffeine, and a tiny bit of chaos.</p>
        <a href="#top">Back to top ↑</a>
        <div className="footer-bottom">
          <span>© 2026 Anshul Sanghi</span>
          <span>Built in React · Animated with CSS · Deployed from Bengaluru</span>
        </div>
      </footer>
    </main>
  );
}

export default App;
