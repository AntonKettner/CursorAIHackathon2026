# Labasi - Your Voice-First Lab Assistant

## The Problem

Picture this: You're in a cleanroom, hands covered in nitrile gloves, carefully aligning a silicon wafer under the electron beam lithography system. You need to check the dose parameters from your last successful run. Your phone is in the gowning room. Your lab notebook is across the facility. Your hands are occupied.

Or you're in a biolab, pipetting Cy5-labeled probes into a nanofluidic chip. You realize you need to verify the molecular weight for your concentration calculations. But your gloves are contaminated, your samples are time-sensitive, and stopping now means starting over.

**In modern research labs, your hands are never free when you need information most.**

Traditional voice assistants fail researchers because they require tedious back-and-forth confirmations, lack domain knowledge, and can't integrate with the specialized tools scientists actually need.

---

## Introducing Labasi

**Labasi** is a voice-first AI assistant purpose-built for laboratory environments. It understands the chaos of research - the gloved hands, the time pressure, the specialized vocabulary - and just *works*.

### What Sets Labasi Apart

#### 1. The Intelligent Logbook

Every conversation becomes part of your searchable research history. Labasi automatically organizes your verbal stream-of-consciousness into:

- **Conversation transcripts** - fully searchable, timestamped, linked to projects
- **Notes** - technical observations extracted and formatted properly
- **Todos** - action items identified and tracked to completion

No more scribbling on glove boxes. No more lost sticky notes. No more "I know I figured this out last month but can't remember where I wrote it."

#### 2. Proactive Intelligence

Unlike traditional assistants that require explicit commands for every action, Labasi anticipates your needs:

- Mention you're having trouble with template stripping? Labasi suggests checking gold freshness and adds a troubleshooting note.
- Ask about Cy5 concentration? Labasi calculates the dilution AND creates a todo to verify the stock solution expiration.
- Describe your enhancement factor results? Labasi logs the data AND reminds you to test lower concentrations next.

**No tedious "Would you like me to save that?" confirmations.** Labasi understands research context and acts accordingly.

#### 3. Selective Domain Intelligence

Labasi uses a fast, responsive language model enhanced with specialized tools via MCP (Model Context Protocol):

- **PubChem Integration** - Instant access to chemical properties, molecular weights, safety data
- **Knowledge Base** - Domain-specific vocabulary with voice recognition corrections for misheard lab terms
- **Project Context** - Always aware of your current experiment, past results, and pending tasks

---

## Live Demo: The Cy5 Workflow

*Imagine you're at the fluorescence microscope, about to start your detection sensitivity experiments...*

---

**You:** "Hey Labasi, I need to prepare a dilution series for the Cy5 probes. What's the molecular weight of Cy5 NHS ester?"

**Labasi:** "Cy5 NHS ester has a molecular weight of 791.99 grams per mol. The extinction coefficient is 250,000 at 649 nanometers, which you'll need for concentration verification by absorbance."

*[Labasi automatically queries PubChem and returns the verified data]*

---

**You:** "Perfect. I want to test concentrations from 1 picomolar up to 1 nanomolar. Can you help me plan the dilutions from my 100 micromolar stock?"

**Labasi:** "For a 1 picomolar to 1 nanomolar series, I recommend a serial dilution approach:

First, dilute your 100 micromolar stock 1:1000 to get 100 nanomolar. Then create a 10-fold serial dilution: 100nM, 10nM, 1nM, 100pM, 10pM, 1pM.

I've added a todo to prepare the dilution series and a note with the dilution scheme for your records."

*[Todo automatically created: "Prepare Cy5 dilution series 1pM-1nM"]*
*[Note automatically added with full dilution protocol]*

---

**You:** "The 1 nanomolar sample is showing good signal. About 4500 counts on the antenna versus 300 on glass. But I'm seeing photobleaching after about 45 seconds."

**Labasi:** "That's a 15-fold enhancement factor - excellent for bowtie nanoantennas! I've recorded these values in your project notes.

The accelerated photobleaching near plasmonic structures is expected due to enhanced local field intensity. I've added a todo to test the ROXS oxygen scavenger system, which can extend Cy5 lifetime by 3-5x.

Also noting that your half-life of 45 seconds is shorter than the typical 120 seconds on glass - this is consistent with the enhancement mechanism."

*[Note created: "Enhancement factor 15x measured (4500 counts antenna vs 300 counts glass)"]*
*[Note created: "Photobleaching half-life ~45s on antenna vs ~120s on glass control"]*
*[Todo created: "Test ROXS oxygen scavenger to extend Cy5 fluorescence lifetime"]*

---

**You:** "What concentration should I try next to find the detection limit?"

**Labasi:** "Based on your signal-to-noise ratio of approximately 15:1 at 1 nanomolar, and assuming noise scales with the square root of concentration, you should still see detectable signal down to around 10-100 femtomolar.

I suggest trying 100 picomolar next. If that works well, move to 10 picomolar. I've updated your todo list with the testing sequence."

*[Todo updated: "Test 100pM Cy5 concentration for detection limit study"]*

---

## The Technology

### Architecture

```
Voice Input (ElevenLabs)
    ↓
Labasi AI Agent (Claude + MCP Tools)
    ↓
┌─────────────────────────────────────┐
│  PubChem API - Chemical properties  │
│  Knowledge Base - Lab vocabulary    │
│  Project Database - Your history    │
│  Todo System - Task management      │
│  Notes System - Observation logging │
└─────────────────────────────────────┘
    ↓
Voice Output + Visual Logbook
```

### Key Features

| Feature | Traditional Assistant | Labasi |
|---------|----------------------|--------|
| Lab vocabulary | "I didn't understand 'E-beam'" | Recognizes 50+ specialized terms with misheard variants |
| Chemical data | "Let me search the web..." | Direct PubChem integration with instant results |
| Note taking | "Would you like me to save that?" | Automatic context-aware extraction |
| Task tracking | Manual list management | Intelligent todo creation from conversation |
| Project context | None | Full awareness of your research history |

---

## Why Now?

The convergence of three technologies makes Labasi possible today:

1. **Large Language Models** that truly understand context and can extract structured information from natural speech
2. **MCP (Model Context Protocol)** enabling seamless integration of specialized tools and databases
3. **Real-time voice AI** with natural conversation flow and low latency

Researchers have been waiting for an assistant that actually understands their work. **Labasi is that assistant.**

---

## The Vision

Every lab notebook entry ever lost. Every brilliant idea forgotten between the microscope and the desk. Every hour wasted searching for "that protocol I definitely wrote down somewhere."

Labasi eliminates these friction points, letting researchers focus on what matters: **the science.**

---

*Labasi - Because your best ideas shouldn't require free hands.*
