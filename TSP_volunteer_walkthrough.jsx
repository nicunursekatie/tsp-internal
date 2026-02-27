import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// CONTENT DATA
// ═══════════════════════════════════════════════════════════════

const FOOD_SAFETY_STEPS = [
  {
    id: "cold-chain",
    title: "The Cold Chain",
    icon: "🔗",
    content: [
      { type: "text", value: "The **cold chain** is the single most important concept in this handbook. It means keeping food consistently cold from purchase all the way to delivery—no gaps, no breaks." },
      { type: "text", value: "Think of every handoff as a link in the chain: **if one breaks, everything downstream is compromised.**" },
      { type: "chain", steps: ["Store", "Cooler", "Home fridge", "Prep", "Fridge", "Cooler", "Host fridge", "Cooler", "Recipient"] },
      { type: "text", value: "Every step in our process is designed to protect this chain. The rules might feel strict, but each one exists because a real food safety risk sits behind it." },
    ],
  },
  {
    id: "temperature",
    title: "Temperature Limits",
    icon: "🌡️",
    content: [
      { type: "text", value: "So what counts as \"cold\"? Here are the three numbers every volunteer needs to know:" },
      { type: "temps", rows: [
        { zone: "Target range", temp: "34–38°F", desc: "Where your fridge should be set. The sweet spot.", status: "ok" },
        { zone: "Maximum safe", temp: "39°F (4°C)", desc: "Above this, the two-hour clock starts.", status: "ok" },
        { zone: "Danger zone", temp: "80°F+ (27°C)", desc: "Food must NEVER reach this. Discard immediately.", status: "danger" },
      ]},
    ],
  },
  {
    id: "two-hour-rule",
    title: "The Two-Hour Rule",
    icon: "⏱️",
    content: [
      { type: "alert", style: "safety", label: "The Two-Hour Rule", value: "Deli meat must stay at or below 39°F at all times, except for a **cumulative total of two hours** across the entire process—from factory to consumer. Based on USDA, FDA, and CDC guidelines." },
      { type: "text", value: "This is not \"two hours at a time.\" The clock runs across **every step** from purchase to delivery. And once bacteria start growing, re-cooling doesn't reverse it." },
      { type: "text", value: "Two hours sounds like plenty—until you add up all the little moments:" },
      { type: "list", items: [
        "**Shopping:** pick up deli ingredients last",
        "**Sandwich-making:** one package of meat and cheese out at a time",
        "**Transfers:** move quickly between fridge, cooler, and car",
        "**Transport:** drive directly to your destination, no stops",
      ]},
    ],
  },
  {
    id: "refrigeration",
    title: "Refrigeration & Coolers",
    icon: "❄️",
    content: [
      { type: "text", value: "Your refrigerator is the **workhorse** of the cold chain—the only equipment that actively lowers and maintains temperature." },
      { type: "list", items: [
        "**Maintain 34–38°F.** Check regularly—don't just assume it's right.",
        "**Don't overfill.** An overpacked fridge creates warm spots—even if the thermometer reads correctly.",
        "**Minimize door openings.** Temps rise fast, especially in hot weather.",
        "**Keep organized.** PB&J and deli separate. Label everything.",
      ]},
      { type: "alert", style: "warning", label: "Coolers ≠ Refrigerators", value: "Coolers keep cold food cold. **They don't cool warm food down.** A cooler just holds in whatever temperature the food already is. Sandwiches must be fridge-cold (below 39°F) before going in." },
      { type: "text", value: "**Maximizing cooler performance:**" },
      { type: "list", items: [
        "**Pack quickly and in the shade.** Keep the cooler closed between trips.",
        "**Ice packs everywhere.** Every loaf should be in direct contact with one.",
        "**Fill it completely.** Tight coolers stay cold significantly longer.",
        "**Keep the lid closed.** Every opening lets warm air in.",
      ]},
    ],
  },
  {
    id: "hygiene",
    title: "Hygiene Standards",
    icon: "🧤",
    content: [
      { type: "text", value: "Food safety isn't just about temperature—it's also about clean hands, clean surfaces, and clean equipment." },
      { type: "text", value: "**Personal hygiene:**" },
      { type: "list", items: [
        "Tie back hair longer than chin-length. Use a beard net for facial hair.",
        "**Wash hands** with soap and water before handling food, during prep, and when finished.",
        "Hand sanitizer is **not** a substitute—alcohol residue transfers to gloves and food.",
        "Wear food-safe gloves. Change them any time you touch something other than food.",
      ]},
      { type: "text", value: "**Clean spaces:**" },
      { type: "list", items: [
        "Clean counters and utensils before starting",
        "Wash coolers with soap and warm water after each use",
        "Clean refrigerators regularly; keep personal items separate",
        "Collection areas: clean, uncluttered, off the floor, away from pets/chemicals",
      ]},
    ],
  },
  {
    id: "safety-warnings",
    title: "Allergy Warning & When in Doubt",
    icon: "⚠️",
    content: [
      { type: "alert", style: "warning", label: "Allergy Warning", value: "**TSP sandwiches are not safe for anyone with food allergies.** Our sandwiches are prepared in home kitchens where we cannot guarantee separation from allergens. Peanut butter, tree nuts, wheat, dairy, and other allergens may be present in any sandwich regardless of type." },
      { type: "text", value: "Always keep PB&J and deli in separate coolers, but understand that this does **not** make them safe for people with allergies." },
      { type: "text", value: "**Not all spoilage is visible** or detectable by smell. Careful handling throughout the entire process is the best protection." },
      { type: "alert", style: "tip", label: "Golden Rule", value: "**When in doubt, throw it out.** Food can make people sick even when it looks, smells, and tastes fine. If something doesn't seem right, trust your instincts and discard it." },
    ],
  },
];

const FOOD_SAFETY_QUIZ = [
  { q: "What is the target temperature range for refrigerators storing TSP food?", options: ["32–36°F", "34–38°F", "38–42°F", "40–45°F"], answer: 1 },
  { q: "How long can deli meat be above 39°F—total, across the entire process?", options: ["30 minutes", "1 hour", "2 hours cumulative", "2 hours at a time"], answer: 2 },
  { q: "Sandwiches got warm during transport. Can you re-cool them in the fridge?", options: ["Yes, as long as they cool within 30 minutes", "Yes, if they weren't above 80°F", "No—re-cooling does not kill bacteria that already grew", "Only if they were warm for less than an hour"], answer: 2 },
  { q: "What does a cooler do?", options: ["Cools warm food down slowly", "Maintains the temperature food is already at", "Kills bacteria through cold air circulation", "Lowers food temp by about 10°F"], answer: 1 },
  { q: "Can you use hand sanitizer instead of washing hands?", options: ["Yes, it's equally effective", "Only if soap isn't available", "No—alcohol residue transfers to gloves and food", "Yes, if you double-glove after"], answer: 2 },
];

const ROLE_STEPS = {
  "sandwich-maker": [
    {
      id: "sm-shopping",
      title: "Shopping & Storage",
      icon: "🛒",
      content: [
        { type: "text", value: "You're the **first link** in the cold chain. The care you put into shopping, prepping, and packing makes a real difference." },
        { type: "text", value: "**Shopping rules:**" },
        { type: "list", items: [
          "**Pre-packaged deli meat and cheese only.** Never deli-counter sliced.",
          "Buy the same quality you'd feed your own family.",
          "Choose expiration dates **at least 7 days** past your drop-off.",
          "Bring a cooler with ice packs. Park in the shade. Go directly home.",
          "Refrigerate meat and cheese immediately.",
        ]},
        { type: "text", value: "**Storage limits:**" },
        { type: "list", items: [
          "Opened meat: **use within 3 days**",
          "All meat and cheese: **use within 2 weeks** of purchase, even if sealed or unexpired",
          "Don't overpack the fridge—air needs to circulate",
        ]},
      ],
    },
    {
      id: "sm-prep",
      title: "Preparation & Assembly",
      icon: "🥪",
      content: [
        { type: "text", value: "**Before you start:**" },
        { type: "list", items: [
          "Clean and cover counters (disposable tablecloth works great)",
          "Hair tied back, beard net on, hands washed, gloves on",
          "Keep PB and nut products **away** from deli ingredients",
        ]},
        { type: "text", value: "**PB&J sandwiches:**" },
        { type: "list", items: [
          "1 tbsp PB on one slice, 2 tbsp on the other (≈ half a ping pong ball each)",
          "**Separate knife** for jelly: 2 tsp (≈ two grapes). Jelly only—no jam.",
          "Press neatly. No oozing to edges. Bag individually, seal, return to loaf bag.",
        ]},
        { type: "text", value: "**Deli sandwiches:**" },
        { type: "list", items: [
          "**One package** of meat + cheese out at a time. Rest stays in fridge.",
          "1 slice cheese on each side (2 total). At least 2 oz meat.",
          "**No condiments.** No lettuce, tomato, mayo, mustard. Just bread, meat, cheese.",
          "Bag individually, seal, return to loaf bag.",
        ]},
      ],
    },
    {
      id: "sm-cold",
      title: "Keeping It Cold & Timing",
      icon: "🧊",
      content: [
        { type: "text", value: "This is where the two-hour rule matters most. **Every minute meat spends outside the fridge counts.**" },
        { type: "list", items: [
          "Make **one loaf at a time.** Immediately return each finished loaf to the fridge.",
          "Only have **one package** of meat and cheese out at a time.",
          "Working with others? Divide tasks—some assemble while others bag and refrigerate.",
        ]},
        { type: "alert", style: "warning", label: "Timing Rule", value: "**Don't make sandwiches before Tuesday evening.** They must reach a host home within 24 hours. Recipients must consume within 3 days—every day of freshness counts." },
        { type: "text", value: "**Labeling:**" },
        { type: "list", items: [
          "TSP-issued labels only (available through the TSP app)",
          "Use the correct label: **Deli** or **PB&J**",
          "Fill out all fields including date made",
          "Label dates no earlier than Tuesday evening (Wednesday preferred)",
        ]},
      ],
    },
    {
      id: "sm-dropoff",
      title: "Wednesday Drop-Off",
      icon: "📦",
      content: [
        { type: "text", value: "**Finding your host:**" },
        { type: "list", items: [
          "Use the **TSP Host Finder** at thesandwichproject.org",
          "Drop off at whichever host works for you—within their listed hours",
          "Check the weekly newsletter for schedule changes and host vacations",
          "Each host has their own instructions (text first, ring doorbell, etc.)",
        ]},
        { type: "alert", style: "tip", label: "Pro Tip", value: "Pop sandwiches in the **freezer for 15–20 minutes** before packing your cooler. Extra cold buffer for the drive—especially in hot weather. Don't leave them longer or they'll freeze solid." },
        { type: "text", value: "**Transporting:**" },
        { type: "list", items: [
          "Pre-cool vehicle with A/C before loading",
          "Pack cooler with ice packs, fill as full as possible",
          "Drive directly to host—**no stops**",
          "Keep cooler in vehicle cabin, **not the trunk**",
        ]},
        { type: "text", value: "**At the host home:** Sign in, record your count, label if needed, and hand off." },
      ],
    },
  ],
  host: [
    {
      id: "h-setup",
      title: "What You Need",
      icon: "🏠",
      content: [
        { type: "text", value: "You're the **hub** that connects everything. Sandwich makers deliver to you, drivers pick up from you." },
        { type: "alert", style: "safety", label: "Your team", value: "You'll be assigned to a team with a **lead host** who can answer your questions and help you get started." },
        { type: "text", value: "**What you provide:**" },
        { type: "list", items: [
          "**Collection area:** accessible to volunteers (often a garage), available Wednesdays",
          "**Dedicated fridge space:** TSP will provide one if needed. Keep personal food out.",
          "**Availability:** Wednesdays for collection, Thursday mornings for pickup",
          "**Drop-off hours & instructions:** you set these (they go on the Host Finder)",
        ]},
        { type: "text", value: "**TSP provides:** yard sign, sign-in sheets, labels (deli + PB&J), coolers, ice packs, thermometer." },
      ],
    },
    {
      id: "h-wednesday",
      title: "Wednesday: Collection Day",
      icon: "📋",
      content: [
        { type: "text", value: "**Before drop-offs begin:**" },
        { type: "list", items: [
          "Place donation bin for fruit/snack collections",
          "Set up sign-in station: sheets, deli & PB&J labels (keep separate), pens",
          "Put out TSP yard sign",
        ]},
        { type: "text", value: "**As volunteers arrive:**" },
        { type: "list", items: [
          "**Greet warmly**—it keeps sandwich makers coming back",
          "Have them sign in and record sandwich count + contact info",
          "Have them label using host-provided labels",
          "Check sandwiches are **sealed, labeled, and cold to the touch**",
          "Verify label dates are no earlier than Tuesday evening",
        ]},
        { type: "text", value: "**Storing:** Refrigerate promptly with room for airflow. Keep PB&J and deli in **separate coolers**." },
        { type: "alert", style: "warning", label: "Remember", value: "TSP sandwiches are **not safe for anyone with food allergies** due to shared home kitchen preparation." },
      ],
    },
    {
      id: "h-thursday",
      title: "Thursday: Delivery Prep",
      icon: "🚚",
      content: [
        { type: "text", value: "Thursday morning—get everything packed and ready for your driver. Keep sandwiches cold, get them out quickly." },
        { type: "list", items: [
          "Confirm sandwiches are **under 39°F** before packing",
          "Layer ice packs between loaves and on top—every loaf touches an ice pack",
          "Pack coolers **tightly** (tight = colder longer)",
          "Close lids quickly. Cooler open as little as possible.",
          "Hot cooler? Bring it inside to cool down first.",
        ]},
        { type: "text", value: "**Quality check before handoff:**" },
        { type: "list", items: [
          "✓ All sandwiches properly sealed",
          "✓ TSP labels complete and legible",
          "✓ Sandwiches cold to the touch",
          "✓ Loaf bags closed with twist ties",
        ]},
      ],
    },
    {
      id: "h-quality",
      title: "Quality Issues & Cleaning",
      icon: "✅",
      content: [
        { type: "text", value: "**Fixable issues:**" },
        { type: "list", items: [
          "**Torn outer bag:** Transfer to new bag if individual wrappers are intact",
          "**Missing labels:** Ask volunteer to label. Confirm made within 24 hours.",
        ]},
        { type: "text", value: "**Non-negotiable rejections** (re-cooling does NOT make food safe):" },
        { type: "list", items: [
          "**Warm sandwiches:** \"We can only take sandwiches that are cold to the touch\"",
          "**Damaged individual wrappers:** if the sandwich is exposed, it can't be used",
          "**Spoiled or off-looking:** trust your instincts, set aside",
        ]},
        { type: "alert", style: "warning", label: "If sandwiches seem unsafe", value: "Isolate immediately. Mark \"DO NOT USE\" with the reason. **Contact your lead host.**" },
        { type: "text", value: "**Contact your lead host when:** sandwiches feel warm, packaging is damaged, labels can't be resolved, or you have any food safety concerns." },
        { type: "text", value: "**Keeping things clean:** Wipe down TSP fridge regularly. Wash coolers after each use, air-dry fully. Keep collection area uncluttered, everything off the floor." },
      ],
    },
  ],
  driver: [
    {
      id: "d-start",
      title: "Before Your First Delivery",
      icon: "🚗",
      content: [
        { type: "text", value: "You're the **final link** in the cold chain—the person who puts sandwiches into the hands of the organizations that distribute them." },
        { type: "alert", style: "safety", label: "Your team", value: "You'll be assigned to a team with a **lead host** who can answer your questions and help you get started." },
        { type: "list", items: [
          "Sign the **Vehicle Release Form** before your first delivery",
          "Contact Jordan (Driver Coordinator) at **770-789-7329** if you haven't received one",
        ]},
      ],
    },
    {
      id: "d-transport",
      title: "Transport Protocol",
      icon: "📋",
      content: [
        { type: "text", value: "Follow these steps every time:" },
        { type: "list", ordered: true, items: [
          "**Pre-cool** your vehicle with A/C before loading",
          "**Confirm** sandwiches are pre-chilled (under 39°F)",
          "**Layer** ice packs between loaves and on top",
          "**Pack tightly**—minimize air space",
          "Keep cooler in the **vehicle cabin** (not the trunk)",
          "**Drive directly** to destination. No stops.",
          "Ensure sandwiches are **refrigerated immediately** on arrival",
          "**Communicate any delays** to the recipient right away",
        ]},
      ],
    },
    {
      id: "d-rules",
      title: "Critical Rules & Standards",
      icon: "⚡",
      content: [
        { type: "alert", style: "warning", label: "Never leave packed coolers in your vehicle", value: "Coolers belong in vehicles only during **active transport**. Parked cars—especially trunks—reach dangerous temperatures faster than you'd expect." },
        { type: "list", items: [
          "**Hot cooler?** Bring inside to cool before packing.",
          "**Warm sandwiches?** Must be fridge-cold before going in a cooler.",
          "Keep lids **sealed** during transport.",
          "TSP coolers are for **TSP sandwiches only.**",
        ]},
        { type: "text", value: "**Delivery standards:**" },
        { type: "list", items: [
          "We deliver to **501(c)(3) organizations only**—legal requirement",
          "**3-day consumption limit:** sandwiches must be eaten within 3 days of label date. Flag violations.",
        ]},
      ],
    },
    {
      id: "d-reporting",
      title: "Reporting Issues",
      icon: "📞",
      content: [
        { type: "text", value: "You're our **eyes and ears** at pickup and drop-off. If you notice any of these, call Marcy:" },
        { type: "list", items: [
          "**Unsafe conditions:** location appears unclean or unsanitary",
          "**Improper storage:** recipient doesn't refrigerate food right away",
          "**Inadequate refrigeration:** recipient lacks sufficient cooling",
        ]},
        { type: "text", value: "These reports help us protect the food **and** the people we serve. Don't hesitate—it's part of the job." },
      ],
    },
  ],
};

const ROLE_QUIZZES = {
  "sandwich-maker": [
    { q: "What type of deli meat should you buy?", options: ["Counter-sliced for freshness", "Pre-packaged only", "Either is fine", "Whichever is cheapest"], answer: 1 },
    { q: "How long can you keep opened meat?", options: ["5 days", "1 week", "3 days", "Until expiration date"], answer: 2 },
    { q: "Where should you keep the cooler in your car?", options: ["In the trunk", "On the roof rack", "In the vehicle cabin with A/C", "Anywhere is fine"], answer: 2 },
    { q: "When is the earliest you can make sandwiches?", options: ["Monday evening", "Tuesday evening", "Wednesday morning", "Any time that week"], answer: 1 },
  ],
  host: [
    { q: "What temperature should your TSP fridge be?", options: ["32–34°F", "34–38°F", "38–42°F", "Below 40°F"], answer: 1 },
    { q: "A volunteer brings sandwiches that feel warm. What do you do?", options: ["Put them in the freezer to cool fast", "Accept them—they'll cool in the fridge", "Kindly decline and explain they must be cold", "Let the volunteer decide"], answer: 2 },
    { q: "Can you use TSP coolers for personal food between collections?", options: ["Yes, if you wash them after", "Only for other cold items", "No—dedicated to TSP sandwiches only", "Yes, as long as it's not raw meat"], answer: 2 },
    { q: "Before the driver picks up, what should you verify?", options: ["Sandwiches are sealed, labeled, cold, and bags closed", "Just that coolers are packed", "Only that labels are on", "Nothing—the driver checks everything"], answer: 0 },
  ],
  driver: [
    { q: "What should you do FIRST before loading coolers?", options: ["Count the sandwiches", "Pre-cool the vehicle with A/C", "Check the route", "Call the recipient"], answer: 1 },
    { q: "Where do coolers go during transport?", options: ["Trunk is fine", "Back seat or passenger seat with A/C", "Anywhere in the car", "On top of the car if it's cool out"], answer: 1 },
    { q: "Who can you deliver sandwiches to?", options: ["Anyone who's hungry", "501(c)(3) organizations only", "Any nonprofit", "Individuals and organizations"], answer: 1 },
    { q: "How long do recipients have to consume the sandwiches?", options: ["24 hours", "3 days from the label date", "1 week", "Until expiration date"], answer: 1 },
  ],
};

const ROLE_META = {
  "sandwich-maker": { label: "Sandwich Maker", emoji: "🥪", color: "#e67e22" },
  host: { label: "Host", emoji: "🏠", color: "#2a7c7a" },
  driver: { label: "Driver", emoji: "🚗", color: "#8e44ad" },
};

// ═══════════════════════════════════════════════════════════════
// RENDERERS
// ═══════════════════════════════════════════════════════════════

function renderMarkdown(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function ContentBlock({ block }) {
  if (block.type === "text") {
    return <p style={styles.paragraph} dangerouslySetInnerHTML={{ __html: renderMarkdown(block.value) }} />;
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag style={{ ...styles.list, ...(block.ordered ? { listStyle: "decimal" } : {}) }}>
        {block.items.map((item, i) => (
          <li key={i} style={styles.listItem} dangerouslySetInnerHTML={{ __html: renderMarkdown(item) }} />
        ))}
      </Tag>
    );
  }
  if (block.type === "alert") {
    const colors = { safety: ["#e8f4f3", "#2a7c7a"], warning: ["#fdecea", "#c0392b"], tip: ["#fdf0ea", "#c4683c"] };
    const [bg, border] = colors[block.style] || colors.safety;
    return (
      <div style={{ ...styles.alert, background: bg, borderLeftColor: border }}>
        {block.label && <div style={{ ...styles.alertLabel, color: border }}>{block.label}</div>}
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(block.value) }} />
      </div>
    );
  }
  if (block.type === "chain") {
    return (
      <div style={styles.chain}>
        {block.steps.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", margin: "3px 0" }}>
            <span style={styles.chainStep}>{s}</span>
            {i < block.steps.length - 1 && <span style={styles.chainArrow}>→</span>}
          </span>
        ))}
      </div>
    );
  }
  if (block.type === "temps") {
    return (
      <div style={styles.tempTable}>
        {block.rows.map((r, i) => (
          <div key={i} style={{ ...styles.tempRow, borderLeft: `4px solid ${r.status === "danger" ? "#c0392b" : "#2a7c7a"}` }}>
            <div style={{ ...styles.tempZone, color: r.status === "danger" ? "#c0392b" : "#2a7c7a" }}>
              {r.status === "danger" ? "✗" : "✓"} {r.zone}
            </div>
            <div style={styles.tempValue}>{r.temp}</div>
            <div style={styles.tempDesc}>{r.desc}</div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════

function WelcomeScreen({ onSelectRole }) {
  return (
    <div style={styles.screen}>
      <div style={styles.welcomeHero}>
        <div style={styles.welcomeOrg}>The Sandwich Project</div>
        <h1 style={styles.welcomeTitle}>Volunteer Onboarding</h1>
        <p style={styles.welcomeTagline}>Nourish the Hungry. Feed the Soul.</p>
      </div>
      <div style={styles.card}>
        <p style={{ ...styles.paragraph, textAlign: "center", fontSize: "1.05rem" }}>
          Welcome! This walkthrough will teach you everything you need to know to volunteer safely and effectively. It takes about <strong>10–15 minutes</strong>.
        </p>
        <p style={{ ...styles.paragraph, textAlign: "center", color: "#666" }}>
          First—what role are you joining as?
        </p>
        <div style={styles.roleGrid}>
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <button key={key} style={styles.roleButton} onClick={() => onSelectRole(key)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}>
              <span style={{ fontSize: "2.2rem" }}>{meta.emoji}</span>
              <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepScreen({ step, stepIndex, totalSteps, onNext, onBack, sectionLabel }) {
  return (
    <div style={styles.screen}>
      <div style={styles.sectionBadge}>{sectionLabel}</div>
      <div style={styles.card}>
        <div style={styles.stepHeader}>
          <span style={styles.stepIcon}>{step.icon}</span>
          <h2 style={styles.stepTitle}>{step.title}</h2>
        </div>
        <div style={styles.stepContent}>
          {step.content.map((block, i) => <ContentBlock key={i} block={block} />)}
        </div>
        <div style={styles.navRow}>
          {onBack && <button style={styles.btnSecondary} onClick={onBack}>← Back</button>}
          <div style={{ flex: 1 }} />
          <button style={styles.btnPrimary} onClick={onNext}>
            {stepIndex === totalSteps - 1 ? "Continue to Quiz →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizScreen({ questions, title, onPass, onBack }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (qi, oi) => {
    if (submitted) return;
    setAnswers({ ...answers, [qi]: oi });
  };

  const handleSubmit = () => {
    const s = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
    setScore(s);
    setSubmitted(true);
  };

  const passed = score >= Math.ceil(questions.length * 0.8);
  const allAnswered = Object.keys(answers).length === questions.length;

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={styles.stepHeader}>
          <span style={styles.stepIcon}>📝</span>
          <h2 style={styles.stepTitle}>{title}</h2>
        </div>
        <p style={{ ...styles.paragraph, color: "#666" }}>
          {submitted ? (passed ? "Great job! You're ready to continue." : "Almost there—review the answers below and try again.") : `Answer ${questions.length} questions to continue. You need ${Math.ceil(questions.length * 0.8)}/${questions.length} correct.`}
        </p>
        {submitted && (
          <div style={{ ...styles.alert, background: passed ? "#e8f4f3" : "#fdecea", borderLeftColor: passed ? "#2a7c7a" : "#c0392b", marginBottom: "1.5rem" }}>
            <strong>{score}/{questions.length} correct</strong> — {passed ? "You passed!" : `Need ${Math.ceil(questions.length * 0.8)} to pass. Give it another shot!`}
          </div>
        )}
        {questions.map((q, qi) => (
          <div key={qi} style={styles.quizQuestion}>
            <div style={styles.quizQText}>{qi + 1}. {q.q}</div>
            <div style={styles.quizOptions}>
              {q.options.map((opt, oi) => {
                let bg = answers[qi] === oi ? "#e8f4f3" : "#fff";
                let border = answers[qi] === oi ? "#2a7c7a" : "#ddd";
                if (submitted) {
                  if (oi === q.answer) { bg = "#e8f4f3"; border = "#2a7c7a"; }
                  else if (answers[qi] === oi) { bg = "#fdecea"; border = "#c0392b"; }
                  else { bg = "#fff"; border = "#eee"; }
                }
                return (
                  <button key={oi} onClick={() => handleSelect(qi, oi)}
                    style={{ ...styles.quizOption, background: bg, borderColor: border, cursor: submitted ? "default" : "pointer", opacity: submitted && oi !== q.answer && answers[qi] !== oi ? 0.5 : 1 }}>
                    <span style={{ ...styles.quizOptionDot, borderColor: border, background: answers[qi] === oi ? border : "transparent" }} />
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div style={styles.navRow}>
          {onBack && !submitted && <button style={styles.btnSecondary} onClick={onBack}>← Back</button>}
          <div style={{ flex: 1 }} />
          {!submitted && <button style={{ ...styles.btnPrimary, opacity: allAnswered ? 1 : 0.5 }} onClick={handleSubmit} disabled={!allAnswered}>Check Answers</button>}
          {submitted && passed && <button style={styles.btnPrimary} onClick={onPass}>Continue →</button>}
          {submitted && !passed && <button style={styles.btnPrimary} onClick={handleRetry}>Try Again</button>}
        </div>
      </div>
    </div>
  );
}

function CompletionScreen({ role, onBrowse }) {
  const meta = ROLE_META[role];
  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
          <h2 style={{ ...styles.stepTitle, textAlign: "center", fontSize: "1.6rem" }}>You're All Set!</h2>
          <p style={{ ...styles.paragraph, textAlign: "center", maxWidth: "480px", margin: "1rem auto", color: "#666" }}>
            You've completed the <strong>{meta.label}</strong> onboarding. You now know the food safety foundations and your role-specific responsibilities.
          </p>
          <div style={{ ...styles.alert, background: "#e8f4f3", borderLeftColor: "#2a7c7a", textAlign: "left", marginTop: "1.5rem" }}>
            <div style={{ ...styles.alertLabel, color: "#2a7c7a" }}>What's Next</div>
            <div>This walkthrough is now your <strong>reference guide</strong>. You can browse any section anytime. Bookmark this page to come back when you need a refresher.</div>
          </div>
          <button style={{ ...styles.btnPrimary, marginTop: "1.5rem", padding: "0.85rem 2.5rem", fontSize: "1rem" }} onClick={onBrowse}>
            Browse Reference Guide →
          </button>
        </div>
      </div>
    </div>
  );
}

function ReferenceMode({ role }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const meta = ROLE_META[role];

  const sections = [
    { id: "food-safety", label: "Food Safety Foundations", icon: "🛡️", steps: FOOD_SAFETY_STEPS },
    { id: "role", label: `${meta.label} Guide`, icon: meta.emoji, steps: ROLE_STEPS[role] },
  ];

  return (
    <div style={styles.screen}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={styles.welcomeOrg}>The Sandwich Project</div>
        <h1 style={{ ...styles.stepTitle, fontSize: "1.5rem" }}>Reference Guide</h1>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>Role: {meta.emoji} {meta.label} — tap any section to expand</p>
      </div>
      {sections.map((section) => (
        <div key={section.id} style={{ marginBottom: "1rem" }}>
          {section.steps.map((step) => {
            const isExpanded = expandedSection === step.id;
            return (
              <div key={step.id} style={{ ...styles.card, marginBottom: "0.5rem", cursor: "pointer" }}
                onClick={() => setExpandedSection(isExpanded ? null : step.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>{step.icon}</span>
                  <span style={{ fontWeight: 600, flex: 1 }}>{step.title}</span>
                  <span style={{ color: "#999", fontSize: "1.2rem", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                </div>
                {isExpanded && (
                  <div style={{ ...styles.stepContent, marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}
                    onClick={(e) => e.stopPropagation()}>
                    {step.content.map((block, i) => <ContentBlock key={i} block={block} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ ...styles.card, textAlign: "center", background: "#f7f3ed" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
          <strong>Questions?</strong> Contact info@thesandwichproject.org · thesandwichproject.org
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

const PHASES = { WELCOME: 0, FOOD_SAFETY: 1, FOOD_QUIZ: 2, ROLE_STEPS: 3, ROLE_QUIZ: 4, COMPLETE: 5, REFERENCE: 6 };

export default function App() {
  const [phase, setPhase] = useState(PHASES.WELCOME);
  const [role, setRole] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  const totalFSSteps = FOOD_SAFETY_STEPS.length;
  const roleSteps = role ? ROLE_STEPS[role] : [];
  const totalRoleSteps = roleSteps.length;

  const totalAllSteps = totalFSSteps + 1 + totalRoleSteps + 1; // +1 for each quiz
  const currentOverall = useMemo(() => {
    if (phase === PHASES.WELCOME) return 0;
    if (phase === PHASES.FOOD_SAFETY) return stepIdx + 1;
    if (phase === PHASES.FOOD_QUIZ) return totalFSSteps + 1;
    if (phase === PHASES.ROLE_STEPS) return totalFSSteps + 1 + stepIdx + 1;
    if (phase === PHASES.ROLE_QUIZ) return totalFSSteps + 1 + totalRoleSteps + 1;
    return totalAllSteps;
  }, [phase, stepIdx, totalFSSteps, totalRoleSteps, totalAllSteps]);

  const progress = phase >= PHASES.COMPLETE ? 100 : Math.round((currentOverall / totalAllSteps) * 100);

  if (phase === PHASES.REFERENCE) return <ReferenceMode role={role} />;

  return (
    <div style={styles.app}>
      {phase > PHASES.WELCOME && phase < PHASES.COMPLETE && (
        <div style={styles.progressContainer}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.progressLabel}>{progress}% complete</div>
        </div>
      )}

      {phase === PHASES.WELCOME && <WelcomeScreen onSelectRole={(r) => { setRole(r); setPhase(PHASES.FOOD_SAFETY); setStepIdx(0); }} />}

      {phase === PHASES.FOOD_SAFETY && (
        <StepScreen
          step={FOOD_SAFETY_STEPS[stepIdx]}
          stepIndex={stepIdx}
          totalSteps={totalFSSteps}
          sectionLabel="Food Safety Foundations"
          onNext={() => stepIdx < totalFSSteps - 1 ? setStepIdx(stepIdx + 1) : setPhase(PHASES.FOOD_QUIZ)}
          onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : () => { setPhase(PHASES.WELCOME); setRole(null); }}
        />
      )}

      {phase === PHASES.FOOD_QUIZ && (
        <QuizScreen
          questions={FOOD_SAFETY_QUIZ}
          title="Food Safety Check"
          onPass={() => { setPhase(PHASES.ROLE_STEPS); setStepIdx(0); }}
          onBack={() => { setPhase(PHASES.FOOD_SAFETY); setStepIdx(totalFSSteps - 1); }}
        />
      )}

      {phase === PHASES.ROLE_STEPS && (
        <StepScreen
          step={roleSteps[stepIdx]}
          stepIndex={stepIdx}
          totalSteps={totalRoleSteps}
          sectionLabel={`${ROLE_META[role].emoji} ${ROLE_META[role].label} Guide`}
          onNext={() => stepIdx < totalRoleSteps - 1 ? setStepIdx(stepIdx + 1) : setPhase(PHASES.ROLE_QUIZ)}
          onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : () => { setPhase(PHASES.FOOD_QUIZ); }}
        />
      )}

      {phase === PHASES.ROLE_QUIZ && (
        <QuizScreen
          questions={ROLE_QUIZZES[role]}
          title={`${ROLE_META[role].label} Knowledge Check`}
          onPass={() => setPhase(PHASES.COMPLETE)}
          onBack={() => { setPhase(PHASES.ROLE_STEPS); setStepIdx(totalRoleSteps - 1); }}
        />
      )}

      {phase === PHASES.COMPLETE && (
        <CompletionScreen role={role} onBrowse={() => setPhase(PHASES.REFERENCE)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(165deg, #f7f3ed 0%, #eee8df 100%)",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#2c2c2c",
    lineHeight: 1.65,
  },
  screen: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "1.5rem 1rem 3rem",
  },
  progressContainer: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(247,243,237,0.95)",
    backdropFilter: "blur(10px)",
    padding: "0.75rem 1.5rem",
    borderBottom: "1px solid #ddd5ca",
  },
  progressTrack: {
    height: "6px",
    background: "#ddd5ca",
    borderRadius: "3px",
    overflow: "hidden",
    maxWidth: "680px",
    margin: "0 auto",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2a7c7a, #3a9a97)",
    borderRadius: "3px",
    transition: "width 0.4s ease",
  },
  progressLabel: {
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "0.35rem",
    fontWeight: 500,
  },
  welcomeHero: {
    textAlign: "center",
    padding: "2.5rem 1rem 2rem",
  },
  welcomeOrg: {
    fontSize: "0.85rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#2a7c7a",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  welcomeTitle: {
    fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
    fontWeight: 700,
    color: "#1d5655",
    lineHeight: 1.2,
    margin: 0,
  },
  welcomeTagline: {
    fontSize: "1rem",
    color: "#888",
    fontStyle: "italic",
    marginTop: "0.5rem",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "clamp(1.25rem, 3vw, 2rem)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: "1rem",
  },
  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginTop: "1.5rem",
  },
  roleButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1.5rem 1rem",
    background: "#f7f3ed",
    border: "2px solid transparent",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    fontFamily: "inherit",
    color: "#2c2c2c",
  },
  sectionBadge: {
    textAlign: "center",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "#2a7c7a",
    textTransform: "uppercase",
    marginBottom: "0.75rem",
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "2px solid #e8f4f3",
  },
  stepIcon: {
    fontSize: "1.6rem",
  },
  stepTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#1d5655",
    margin: 0,
    lineHeight: 1.3,
  },
  stepContent: {},
  paragraph: {
    marginBottom: "0.9rem",
    lineHeight: 1.7,
  },
  list: {
    margin: "0.5rem 0 1rem 1.25rem",
    padding: 0,
  },
  listItem: {
    marginBottom: "0.5rem",
    lineHeight: 1.6,
    paddingLeft: "0.25rem",
  },
  alert: {
    padding: "1rem 1.25rem",
    borderRadius: "10px",
    borderLeft: "4px solid",
    margin: "1rem 0",
    fontSize: "0.93rem",
    lineHeight: 1.6,
  },
  alertLabel: {
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: "0.75rem",
    letterSpacing: "0.06em",
    marginBottom: "0.3rem",
  },
  chain: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "2px",
    margin: "1rem 0",
    padding: "1rem",
    background: "#f7f3ed",
    borderRadius: "10px",
  },
  chainStep: {
    background: "#e8f4f3",
    color: "#1d5655",
    padding: "0.3rem 0.65rem",
    borderRadius: "20px",
    fontWeight: 500,
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  },
  chainArrow: {
    color: "#bbb",
    fontWeight: 700,
    margin: "0 2px",
    fontSize: "0.8rem",
  },
  tempTable: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    margin: "1rem 0",
  },
  tempRow: {
    background: "#f9f9f9",
    padding: "0.85rem 1rem",
    borderRadius: "8px",
    borderLeft: "4px solid",
  },
  tempZone: {
    fontWeight: 600,
    fontSize: "0.85rem",
    marginBottom: "0.2rem",
  },
  tempValue: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#2c2c2c",
  },
  tempDesc: {
    fontSize: "0.88rem",
    color: "#666",
    marginTop: "0.1rem",
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    marginTop: "2rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid #eee",
    gap: "0.75rem",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #2a7c7a, #1d5655)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0.7rem 1.5rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  btnSecondary: {
    background: "transparent",
    color: "#2a7c7a",
    border: "2px solid #2a7c7a",
    borderRadius: "10px",
    padding: "0.65rem 1.25rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  quizQuestion: {
    marginBottom: "1.5rem",
  },
  quizQText: {
    fontWeight: 600,
    marginBottom: "0.6rem",
    fontSize: "0.98rem",
    lineHeight: 1.5,
  },
  quizOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  quizOption: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.65rem 0.9rem",
    border: "2px solid #ddd",
    borderRadius: "10px",
    background: "#fff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    textAlign: "left",
    transition: "all 0.15s",
    lineHeight: 1.5,
  },
  quizOptionDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid #ddd",
    flexShrink: 0,
  },
};
