"""
Quantum-Inspired Genetic Algorithm (QIGA) – Haupt-Evolutions-Motor für Strategie-Chromosome.

Klassische Evolution mit quanten-inspirierten Operatoren (Rotations-Gate auf Gen-Paaren,
Entanglement-Score über Korrelation der Gene) und Multi-Ziel-Fitness. Paper-Trading- und
Safety-Schichten sind über Protokolle injizierbar; echte QC-Hardware kann später den
Rotations-/Sampling-Schritt ersetzen (siehe ``quantum_backend`` in :mod:`settings`).
"""

from __future__ import annotations

import logging
import math
import random
import uuid
from dataclasses import dataclass, field
from typing import Any, Protocol, Sequence

import numpy as np

from .settings import QuantumInspiredSettings, get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Protokolle: Paper-Trading & Safety (Oracle Shield)
# ---------------------------------------------------------------------------


class PaperTraderProtocol(Protocol):
    """Minimaler Vertrag für Paper-Evaluierung einer Strategie."""

    def evaluate(
        self,
        chromosome: StrategyChromosome,
        *,
        days: int,
        seed: int | None = None,
    ) -> PaperEvaluationResult:
        """Führt Paper- oder Simulations-Eval aus und liefert Kennzahlen."""
        ...


class SafetyOracleProtocol(Protocol):
    """Oracle Shield – harte und weiche Gates."""

    def check(self, metrics: dict[str, float], explainability: dict[str, Any]) -> SafetyVerdict:
        ...


@dataclass(frozen=True, slots=True)
class PaperEvaluationResult:
    """Ergebnis einer Paper-Trading-Simulation."""

    sharpe_proxy: float
    max_drawdown_pct: float
    total_return_pct: float
    win_rate: float
    trades: int
    passed: bool
    notes: list[str] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class SafetyVerdict:
    """Entscheidung der Safety-Schicht."""

    approved: bool
    reasons: list[str]
    risk_score: float  # 0 = gut, 1 = kritisch


@dataclass(slots=True)
class StrategyChromosome:
    """
    Binäres/continuous Hybrid-Chromosom für Handels-Hyperparameter.

    ``genes`` sind Werte in ``[-1, 1]`` (kontinuierlich); ``allele_bits`` optional für
    diskrete Masken (Crossover/Mutation auf Bits).
    """

    genes: np.ndarray
    allele_bits: np.ndarray | None = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    generation: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.genes.ndim != 1:
            raise ValueError("genes must be 1-D array")
        if self.allele_bits is not None and self.allele_bits.shape[0] != self.genes.shape[0]:
            raise ValueError("allele_bits length must match genes")

    def copy(self) -> StrategyChromosome:
        bits = None if self.allele_bits is None else self.allele_bits.copy()
        return StrategyChromosome(
            genes=self.genes.copy(),
            allele_bits=bits,
            id=str(uuid.uuid4()),
            generation=self.generation,
            metadata=dict(self.metadata),
        )


def quantum_rotation_gate(
    genes: np.ndarray,
    pair_indices: Sequence[tuple[int, int]],
    theta: float,
    *,
    rng: random.Random,
) -> np.ndarray:
    """
    Wendet einen quanten-inspirierten *mixing*-Operator auf Gen-Paare an (klassische Simulation).

    Inspiriert durch GROVER/Rotations-Gates: Paare (i,j) werden in der Ebene gedreht,
    begrenzt auf ``[-1, 1]``. Kein echter QPU-Aufruf – API-kompatibel für späteren Ersatz
    durch PennyLane-Parameter-Rotation.
    """
    out = genes.astype(np.float64, copy=True)
    c, s = math.cos(theta), math.sin(theta)
    for i, j in pair_indices:
        if i >= len(out) or j >= len(out):
            continue
        gi, gj = float(out[i]), float(out[j])
        out[i] = np.clip(c * gi - s * gj, -1.0, 1.0)
        out[j] = np.clip(s * gi + c * gj, -1.0, 1.0)
    # leichte asymmetrische Störung nur wenn nicht deterministisch gewünscht
    if rng.random() < 0.05:
        k = rng.randrange(len(out))
        out[k] = float(np.clip(out[k] + rng.gauss(0, 0.02), -1.0, 1.0))
    return out.astype(np.float32)


def entanglement_score(genes: np.ndarray) -> float:
    """
    Misst paarweise *Verschränkung* als normalisierte Korrelationsenergie der Gene.

    Rückgabe in ``[0, 1]``: höher = stärkere interne Kopplung (kann Risiko oder Kohärenz signalisieren).
    """
    if genes.size < 2:
        return 0.0
    g = genes.astype(np.float64)
    g = g - g.mean()
    std = float(np.std(g)) + 1e-9
    g = g / std
    # paarweise Produkt-Mittel als Proxy
    pairs = g[:-1] * g[1:]
    e = float(np.mean(np.abs(pairs)))
    return float(np.clip(e, 0.0, 1.0))


@dataclass(slots=True)
class MultiObjectiveFitness:
    """Aggregierte Fitness mit erklärbaren Komponenten."""

    total: float
    sharpe_component: float
    drawdown_penalty: float
    return_component: float
    entanglement_component: float
    diversity_bonus: float
    explainability: dict[str, Any]


class DefaultPaperTrader:
    """
    Deterministischer Paper-Trader-Stub: mappt Chromosom auf Kennzahlen ohne echte Marktdaten.

    Produktion: durch Connector-gestützte Implementierung ersetzen.
    """

    def evaluate(
        self,
        chromosome: StrategyChromosome,
        *,
        days: int,
        seed: int | None = None,
    ) -> PaperEvaluationResult:
        rng = random.Random((seed or 0) ^ hash(chromosome.id) & 0xFFFFFFFF)
        g = chromosome.genes.astype(np.float64)
        smooth = float(np.mean(np.abs(np.diff(g))))
        ent = entanglement_score(g)
        sharpe_proxy = 0.2 + 1.4 * float(np.mean(np.abs(g))) - 0.3 * smooth + 0.15 * (rng.random() - 0.5)
        mdd = 8.0 + 22.0 * smooth + 10.0 * ent + rng.uniform(0, 6)
        ret = sharpe_proxy * math.sqrt(max(days, 1) / 252.0) * 18.0 - 0.25 * mdd
        win = float(np.clip(0.42 + 0.2 * float(np.mean(g > 0)) - 0.1 * ent, 0.2, 0.75))
        trades = int(20 + days * (0.5 + abs(float(np.sum(g[:4])))))
        notes = [
            f"smoothness={smooth:.4f}",
            f"entanglement_used={ent:.4f}",
            f"synthetic_seed={seed}",
        ]
        passed = sharpe_proxy > 0.35 and mdd < 28.0
        return PaperEvaluationResult(
            sharpe_proxy=sharpe_proxy,
            max_drawdown_pct=mdd,
            total_return_pct=ret,
            win_rate=win,
            trades=trades,
            passed=passed,
            notes=notes,
        )


class DefaultOracleShield:
    """Einfache Schwelle-basierte Oracle-Shield-Implementierung."""

    def __init__(self, settings: QuantumInspiredSettings | None = None) -> None:
        self._s = settings or get_settings()

    def check(self, metrics: dict[str, float], explainability: dict[str, Any]) -> SafetyVerdict:
        reasons: list[str] = []
        risk = 0.0
        mdd = metrics.get("max_drawdown_pct", 0.0)
        if mdd > self._s.safety_max_drawdown_pct:
            reasons.append(f"max_drawdown {mdd:.2f}% > limit {self._s.safety_max_drawdown_pct}%")
            risk += 0.45
        sharpe = metrics.get("sharpe_proxy", 0.0)
        if sharpe < self._s.safety_min_sharpe_proxy:
            reasons.append(f"sharpe_proxy {sharpe:.3f} < min {self._s.safety_min_sharpe_proxy}")
            risk += 0.35
        ent = float(explainability.get("entanglement_score", 0.0))
        if self._s.oracle_shield_strict and ent > 0.92:
            reasons.append("extreme entanglement score — manual review recommended")
            risk += 0.2
        # Harte Gates: Drawdown / Sharpe-Verletzungen führen immer zu Ablehnung
        hard_fail = mdd > self._s.safety_max_drawdown_pct or sharpe < self._s.safety_min_sharpe_proxy
        if self._s.oracle_shield_strict:
            approved = not hard_fail and risk < 0.35
        else:
            approved = not hard_fail and risk < 0.65
        return SafetyVerdict(approved=approved, reasons=reasons, risk_score=min(risk, 1.0))


def multi_objective_fitness(
    paper: PaperEvaluationResult,
    entanglement: float,
    settings: QuantumInspiredSettings,
    *,
    population_diversity: float,
) -> MultiObjectiveFitness:
    """Kombiniert Paper-Kennzahlen, Entanglement und Diversitäts-Bonus."""
    sharpe_c = max(0.0, paper.sharpe_proxy)
    dd_pen = max(0.0, paper.max_drawdown_pct / 100.0)
    ret_c = max(-1.0, paper.total_return_pct / 100.0)
    ent_c = settings.qiga_entanglement_weight * (1.0 - abs(entanglement - 0.45))  # moderate Kopplung bevorzugt
    div_bonus = 0.05 * min(1.0, population_diversity)
    total = (
        1.2 * sharpe_c
        - 0.9 * dd_pen
        + 0.4 * ret_c
        + ent_c
        + div_bonus
    )
    expl: dict[str, Any] = {
        "sharpe_proxy": paper.sharpe_proxy,
        "max_drawdown_pct": paper.max_drawdown_pct,
        "total_return_pct": paper.total_return_pct,
        "win_rate": paper.win_rate,
        "trades": paper.trades,
        "entanglement_score": entanglement,
        "population_diversity": population_diversity,
        "weights": {"sharpe": 1.2, "drawdown": -0.9, "return": 0.4, "entanglement": settings.qiga_entanglement_weight},
    }
    return MultiObjectiveFitness(
        total=float(total),
        sharpe_component=sharpe_c,
        drawdown_penalty=dd_pen,
        return_component=ret_c,
        entanglement_component=ent_c,
        diversity_bonus=div_bonus,
        explainability=expl,
    )


@dataclass(slots=True)
class EvolutionResult:
    """Ergebnis eines evolve()-Laufs."""

    best: StrategyChromosome
    best_fitness: MultiObjectiveFitness
    history: list[dict[str, Any]]
    evaluated_population: list[tuple[StrategyChromosome, MultiObjectiveFitness, PaperEvaluationResult]]


class QIGAEngine:
    """
    Haupt-Evolutions-Motor: Population → Bewertung (Paper) → Fitness → Selektion → Variation.

    ``evolve()`` führt den vollen Zyklus aus; Safety kann pro Kandidat optional geprüft werden.
    """

    def __init__(
        self,
        settings: QuantumInspiredSettings | None = None,
        paper_trader: PaperTraderProtocol | None = None,
        safety: SafetyOracleProtocol | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.paper = paper_trader or DefaultPaperTrader()
        self.safety = safety or DefaultOracleShield(self.settings)
        self._rng = random.Random(self.settings.random_seed)

    def _random_chromosome(self, length: int) -> StrategyChromosome:
        genes = np.array([self._rng.uniform(-1, 1) for _ in range(length)], dtype=np.float32)
        bits = np.array([self._rng.randint(0, 1) for _ in range(length)], dtype=np.int8)
        return StrategyChromosome(genes=genes, allele_bits=bits, generation=0)

    def _population_diversity(self, pop: list[StrategyChromosome]) -> float:
        if len(pop) < 2:
            return 0.0
        mat = np.stack([p.genes for p in pop])
        dist = np.mean(np.std(mat, axis=0))
        return float(np.clip(dist, 0.0, 1.0))

    def _crossover(self, a: StrategyChromosome, b: StrategyChromosome) -> tuple[StrategyChromosome, StrategyChromosome]:
        n = len(a.genes)
        point = self._rng.randint(1, n - 1) if n > 2 else 1
        g1 = np.concatenate([a.genes[:point], b.genes[point:]])
        g2 = np.concatenate([b.genes[:point], a.genes[point:]])
        c1 = StrategyChromosome(genes=g1.astype(np.float32), allele_bits=None, generation=max(a.generation, b.generation) + 1)
        c2 = StrategyChromosome(genes=g2.astype(np.float32), allele_bits=None, generation=max(a.generation, b.generation) + 1)
        return c1, c2

    def _mutate(self, c: StrategyChromosome) -> StrategyChromosome:
        g = c.genes.copy()
        for i in range(len(g)):
            if self._rng.random() < self.settings.qiga_mutation_rate:
                g[i] = float(np.clip(g[i] + self._rng.gauss(0, 0.18), -1.0, 1.0))
        pairs = [(i, (i + 1) % len(g)) for i in range(0, len(g) - 1, 2)]
        if self._rng.random() < 0.35:
            g = quantum_rotation_gate(
                g,
                pairs,
                self.settings.qiga_rotation_strength * math.pi,
                rng=self._rng,
            )
        return StrategyChromosome(
            genes=g.astype(np.float32),
            allele_bits=c.allele_bits,
            generation=c.generation + 1,
            metadata=dict(c.metadata),
        )

    def _evaluate_one(
        self,
        chrom: StrategyChromosome,
        diversity: float,
    ) -> tuple[MultiObjectiveFitness, PaperEvaluationResult]:
        paper = self.paper.evaluate(
            chrom,
            days=self.settings.paper_eval_days,
            seed=self.settings.random_seed,
        )
        ent = entanglement_score(chrom.genes)
        fit = multi_objective_fitness(paper, ent, self.settings, population_diversity=diversity)
        chrom.metadata["entanglement_score"] = ent
        chrom.metadata["paper"] = {
            "sharpe_proxy": paper.sharpe_proxy,
            "max_drawdown_pct": paper.max_drawdown_pct,
            "total_return_pct": paper.total_return_pct,
        }
        return fit, paper

    def evolve(
        self,
        *,
        generations: int | None = None,
        population_size: int | None = None,
        pre_screen_safety: bool = False,
    ) -> EvolutionResult:
        """
        Führt die Evolution aus.

        Args:
            generations: überschreibt Settings, falls gesetzt
            population_size: überschreibt Settings
            pre_screen_safety: wenn True, Safety-Check nach Paper (zusätzlich zu Fitness-Filter)
        """
        pop_n = population_size or self.settings.qiga_population_size
        gen_n = generations or self.settings.qiga_generations
        length = self.settings.qiga_chromosome_length

        population = [self._random_chromosome(length) for _ in range(pop_n)]
        history: list[dict[str, Any]] = []
        best_overall: tuple[StrategyChromosome, MultiObjectiveFitness, PaperEvaluationResult] | None = None
        last_scored: list[tuple[StrategyChromosome, MultiObjectiveFitness, PaperEvaluationResult]] = []

        for gen in range(gen_n):
            diversity = self._population_diversity(population)
            scored: list[tuple[StrategyChromosome, MultiObjectiveFitness, PaperEvaluationResult]] = []
            for chrom in population:
                try:
                    fit, paper = self._evaluate_one(chrom, diversity)
                except Exception as exc:
                    logger.exception("Evaluation failed for chromosome %s: %s", chrom.id, exc)
                    continue
                metrics = {
                    "sharpe_proxy": paper.sharpe_proxy,
                    "max_drawdown_pct": paper.max_drawdown_pct,
                }
                if pre_screen_safety:
                    verdict = self.safety.check(metrics, fit.explainability)
                    chrom.metadata["oracle_shield_gen"] = {"approved": verdict.approved, "reasons": verdict.reasons}
                    if not verdict.approved:
                        fit = MultiObjectiveFitness(
                            total=fit.total - 0.5,
                            sharpe_component=fit.sharpe_component,
                            drawdown_penalty=fit.drawdown_penalty + 0.1,
                            return_component=fit.return_component,
                            entanglement_component=fit.entanglement_component,
                            diversity_bonus=fit.diversity_bonus,
                            explainability={**fit.explainability, "safety_blocked": True},
                        )
                scored.append((chrom, fit, paper))

            if not scored:
                raise RuntimeError("No valid individuals in population")

            scored.sort(key=lambda x: x[1].total, reverse=True)
            best = scored[0]
            if best_overall is None or best[1].total > best_overall[1].total:
                best_overall = (best[0].copy(), best[1], best[2])

            history.append(
                {
                    "generation": gen,
                    "best_fitness": best[1].total,
                    "mean_fitness": float(np.mean([s[1].total for s in scored])),
                    "best_id": best[0].id,
                    "explainability": best[1].explainability,
                }
            )
            logger.info(
                "QIGA gen=%d best_fitness=%.4f mean=%.4f id=%s",
                gen,
                best[1].total,
                float(np.mean([s[1].total for s in scored])),
                best[0].id,
            )

            # Selektion + neue Generation
            elite_n = min(self.settings.qiga_elitism_count, len(scored))
            elites = [scored[i][0].copy() for i in range(elite_n)]
            new_pop: list[StrategyChromosome] = list(elites)
            last_scored = scored
            while len(new_pop) < pop_n:
                # Turnier
                def pick() -> StrategyChromosome:
                    a, b = self._rng.sample(scored, 2)
                    return a[0] if a[1].total >= b[1].total else b[0]

                if self._rng.random() < self.settings.qiga_crossover_rate and len(new_pop) + 1 < pop_n:
                    p, q = pick(), pick()
                    c1, c2 = self._crossover(p, q)
                    new_pop.append(self._mutate(c1))
                    if len(new_pop) < pop_n:
                        new_pop.append(self._mutate(c2))
                else:
                    new_pop.append(self._mutate(pick()))
            population = new_pop[:pop_n]

        assert best_overall is not None
        return EvolutionResult(
            best=best_overall[0],
            best_fitness=best_overall[1],
            history=history,
            evaluated_population=last_scored,
        )


def evolve_strategies(
    *,
    settings: QuantumInspiredSettings | None = None,
    paper_trader: PaperTraderProtocol | None = None,
    safety: SafetyOracleProtocol | None = None,
    generations: int | None = None,
    population_size: int | None = None,
) -> EvolutionResult:
    """Funktionale Fassade für :class:`QIGAEngine`."""
    engine = QIGAEngine(settings=settings, paper_trader=paper_trader, safety=safety)
    return engine.evolve(generations=generations, population_size=population_size, pre_screen_safety=True)
