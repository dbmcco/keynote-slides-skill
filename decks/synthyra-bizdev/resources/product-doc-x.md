<!-- ABOUTME: Internal summary for Product Doc X anchored on current product concepts. -->
<!-- ABOUTME: Layers stack (SYNTERACT 4, DSM, CAMP, Turbo) and pricing hypotheses for review. -->
# Product Doc X

## Overview
- This doc is anchored on the current product concepts as the North Star for product framing.
- SYNTHYRA centers on three core product families: Systems Biology and Drug Discovery, Real-Time Biodefense, and Systems-Level Safety and Toxicity.
- Specialized cross-sector modules (microbiome interactions, functional annotation of novel proteins, environmental compound safety screening) are secondary add-ons rather than core suites; ag appears only in the environmental safety module.
- Packaging supports an enterprise platform and vertical-specific suites aligned to the three core families.
- Platform stack layering adds DSM sequence generation, CAMP functional annotation, and Synteract (Turbo + 4) proteome-scale interaction inference in support of discovery and safety workflows.
- Pricing ranges below are pulled from multiple internal documents and should be treated as hypotheses until consolidated.

## Product Understanding
- The Systems Biology and Drug Discovery suite is a four-engine workflow: Proteome-Scale Lead Explorer, Lead Enhancement Engine, Disease Network Target Scorer, and Repurposing and Asset Rescue Engine.
- Proteome-Scale Lead Explorer scans entire proteomes with tissue and compartment filters, phenotype-linked hit scoring, and protein complex assembly prediction.
- Lead Enhancement Engine performs network-aware, multi-objective optimization with real-time off-target checking and developability presets.
- Disease Network Target Scorer builds disease-specific interactomes from transcriptomic and proteomic data to rank targets by network importance and phenotype linkage.
- Repurposing and Asset Rescue Engine maps off-target predictions to disease modules to surface new indications, combinations, and rescue candidates.
- The North Star engines are enabled by a shared platform stack: DSM for candidate sequence generation and optimization, CAMP for ontology-aware annotation and MOA context, Synteract Turbo for proteome-scale off-target screening, and Synteract 4 for ultrafast interaction decisioning that feeds early go/no-go and safety signals.
- The Real-Time Biodefense suite includes Host-Pathogen Interaction Mapper, Rapid Countermeasure Designer, and Epidemic Variant Impact Analyzer.
- The Systems-Level Safety and Toxicity suite includes Phase I Clinical Trial Viability Predictor, Off-Target Interaction Predictor, Polypharmacy Risk Analyzer, and Mechanistic Toxicology Explorer.
- Secondary, cross-sector modules include Microbiome-Human Interaction Mapper, Functional Annotation Engine, and Environmental Compound Safety Screener.
- Bundling supports an enterprise platform, vertical-specific suites, and a discounted academic research license for select modules.

## Market Understanding
- Core markets include therapeutic discovery and optimization, biodefense and pandemic response, and safety or toxicity risk evaluation.
- Primary customers span big pharma, microbiome therapeutics and diagnostics, protein engineering and synthetic biology companies, and academic labs.
- Biodefense demand targets emerging threat response and pandemic preparedness organizations needing rapid interaction mapping and countermeasure design.
- Safety and risk evaluation buyers include teams focused on Phase I viability, off-target screening, and polypharmacy risk.
- Specialized modules extend into microbiome-focused companies, protein design and enzyme discovery groups, and environmental safety stakeholders.

## Technology Understanding
- Core differentiators include multi-species PPI prediction across human, mouse, bacteria, viruses, and fungi.
- Systems-level mechanistic inference and real-time pathogen analysis use networks, pathways, and phenotypes to drive targeting, safety, and countermeasure design.
- Proteome-wide throughput and infrastructure-level speed enable whole-proteome scans in seconds and real-time analysis at massive scale, with Synteract 4 matmul throughput and Synteract Turbo precomputed proteomes as the primary levers.
- The platform stack runs as a generate-annotate-screen loop: DSM generates candidate sequences, CAMP annotates function and pathways, Synteract Turbo screens proteome-scale off-targets, and Synteract 4 accelerates interaction decisioning for early safety and trial-risk signals.
- Synteract 4 uses single-vector protein embeddings with dot-product matmul all-vs-all scoring on pre-embedded proteomes; throughput becomes memory-limited at scale.
- Synteract 4 prioritizes pooled-vector interaction decisioning over residue-level structure reconstruction and is positioned as a proteome-scale engine for earlier safety and trial-risk signals.
- Throughput claims reference ~375M PPI/sec and full human proteome in 1-2 seconds, superseding older timing.
- DSM is a masked diffusion pLM on ESM2 that generates biomimetic sequences with high corruption; trained on human proteome for 20-2048 residue sequences.
- CAMP provides ontology-aware, sequence-only functional annotation (EC, GO MF/CC/BP, domains, cofactors) with reported 79% accuracy and benchmark wins.
- Synteract Turbo enables proteome-scale PPI prediction with reported accuracy and precomputed proteomes; outputs include interaction probability, affinity, and binding sites.
- Benchmarking uses MCC for imbalance with Synteract 4 MCC ~0.33 vs Synteract 3 ~0.31; downstream trial-failure/toxicity proxies are discussed.

## Detailed Technology
- Whole-proteome screening supports tissue and compartment filters, phenotype-linked scoring, and complex assembly prediction; off-target screening profiles candidates across the human proteome with phenotype annotations.
- Lead optimization uses multi-objective objectives (affinity, specificity, stability, solubility) plus immunogenicity checks and templated scaffolds; safety analysis maps off-targets to AOPs, species translation risk, and polypharmacy network overlap.
- Disease network scoring builds context-specific interactomes from transcriptomic and proteomic inputs and tracks network rewiring; biodefense mapping generates host-pathogen networks and variant impact analysis.
- DSM-650 generates 100k to millions of variants and DSM-ppi hallucinates de novo; top 1k ranked and top ~100 modeled (AF3/Chai1) with structural metrics feeding Synteract; DSM is trained on the human proteome with 20-2048 residue sequences.
- DSM workflow generates 100-1000 candidates, applies foldability filters, then CAMP annotation and Synteract Turbo screening to output 5-10 candidates for synthesis.
- DSM validation claims include 87% binding improvement, EGFR 1.1 nM, PD-L1 8.3 nM, Cas9 validated, and 40 POC proteins.
- CAMP adds interpretable pathway/MOA context for off-target ID, repurposing, and toxicity; transformer-based sequence-only annotation without structure with reported 79% accuracy and benchmark wins.
- Synteract Turbo training includes 180k verified + 170k synthetic negatives; reported 92% cross-species and 94% within-species accuracy, 83% vs 25% Dickinson; outputs probability/binary scores, affinity (pKd), and binding sites with precomputed human proteome queries in minutes.
- Synteract 4 uses pooled single-vector embeddings and matmul all-vs-all on pre-embedded proteomes; throughput is memory-limited at scale and claims ~375M PPI/sec with full human in 1-2 seconds, trading residue-level reconstruction for interaction decisioning speed.
- Synteract 4 MCC ~0.33 vs Synteract 3 ~0.31 with MCC chosen for imbalance; framing emphasizes earlier go/no-go and trial-risk signals.

## Pricing Hypotheses
- Packaging aligns to enterprise platform, vertical suites, and discounted academic licensing; pricing ranges are hypotheses and vary by segment with tier boundaries still provisional.
- Safety validation tier hypotheses: per-molecule $10K-50K, comprehensive screen $100K-500K, strategic retainer $250K-1M/year, enterprise platform $2M-5M/year, pilots $25K-50K.
- Segment pricing hypotheses: CRO $75K-150K annual or 15-25% revenue share; large pharma $300K-500K unlimited or $100K-300K per proteome screen; mid biotech $100K-250K annual; startups $50K-100K with caps; add-ons for support, integration, training.
- Interactome packaging hypotheses include one-time reports, monitoring subscriptions, API/usage endpoints, licensed reference libraries, flat licenses, hybrid base plus per-use, and value-linked deals with milestones and single-digit royalties.
- SYNTERACT delivery hypotheses span project, API, and enterprise licenses; API tiers $2K-10K/month dev, $25K-75K/month growth, $250K+/year enterprise; OEM licensing $250K-1.5M/year.
- Competitive offer benchmarks include $25K-150K per asset risk report, $100K-300K/year biotech subscription, $300K-1.5M/year pharma subscription, usage-based compute tiers, and partnerships $500K-2M upfront plus milestones.
- Licensing term hypotheses: upfront $2-10M, milestones $20-100M, royalties 3-8%; lifecycle licensing $500K-2M upfront + $1-5M milestones + 0.5-2% royalties.
- Patent strategy notes cite per-compound licensing in the $10-50M range with $2-10M upfront, $3-15M development milestones, $5-25M regulatory milestones, and 3-8% royalties.
- Patent cliff benchmarks and platform vs asset gaps: upfront $1-10M with $10-50M or $100M milestones and 1-5% royalties; platform screens $100K-500K vs asset deals $10-30M upfront + $50-250M milestones.
- External benchmarks and ROI anchors: CRO proteome screen $100K-500K (10-20% of $5M+ experimental), per-query $10-500, subscription $2K-10K/month, enterprise licenses $100K-500K/year; ADMET Predictor ~$375K, GastroPlus ~$150K; experimental proteome screens $500K-5M vs computational $100K-500K and Phase II failure $50-100M vs $100-500K screen.
- Cross-modal alignment monetization notes point to low five-figure pilots, six to seven figure enterprise SaaS or API licenses, and a small number of strategic licensing partnerships.

## Open Questions
- Harmonize speed and benchmark claims across North Star, Synteract 4, and Synteract Turbo materials, including throughput timing and MCC vs accuracy framing.
- Map North Star engine names to DSM/CAMP/Synteract/Turbo stack explicitly in product docs and workflows.
- Define Turbo vs Synteract 4 product roles and output expectations (probability, affinity, binding sites vs pooled decisioning) across the North Star workflows.
- Consolidate pricing ranges into a single packaging model with usage metrics and contract structures across platform, suites, API, and reports.
- Deployment model, validation evidence thresholds, and integration points (data ingestion, workflow APIs, reporting outputs) remain open.
