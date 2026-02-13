---
name: agentic-governance
description: Specialist in agentic standards (x402, MCP, ACP, A2A, ANP) and inter-agent communication protocols. Masters smart contract logic applied to KOL/Agency relationships: revenue-share, affiliate tracking, on-chain attribution. Use when designing agent-to-agent payment flows, API monetization for AI agents, influencer partnership contracts, or when the user mentions x402, A2A, KOL partnerships, or agentic commerce.
---

# Agentic Governance

Expertise en normes agentiques, protocoles de communication inter-agents et logique des smart contracts appliquée aux relations KOL/Agency.

## Quand appliquer ce skill

- Conception de flux de paiement agent-to-agent (x402, A2A)
- Monetisation d’API pour agents IA
- Contrats KOL/influenceurs (revenue-share, attribution on-chain)
- Choix ou comparaison de protocoles inter-agents (MCP, ACP, A2A, ANP)
- Modélisation de relations Agency ↔ Creator avec exécution automatisée

---

## 1. Standard x402 (paiements natifs web)

### Principe

x402 est un standard de paiement HTTP basé sur le code **402 Payment Required**. Permet aux agents et services web de payer de façon autonome pour accéder à des API, données ou services numériques.

### Flux

1. Le client envoie une requête HTTP à un endpoint
2. Le serveur répond **402** + exigences de paiement (montant, adresse, chain)
3. Le client exécute un paiement on-chain (stablecoin, etc.)
4. Le serveur vérifie, répond **200 OK** et livre la ressource

### Caractéristiques

| Aspect        | Détail                                                   |
| ------------- | -------------------------------------------------------- |
| Frais         | Pas de frais de protocole, uniquement frais réseau       |
| Règlement     | Instantané                                               |
| Chain         | Agnostic (USDC multi-chains)                             |
| Intégration   | Réponse 402 + metadata standardisée                      |
| Identité (V2) | Wallet-based identity, pas de re-paiement à chaque appel |

### Points d’attention

- **x402 V2** (déc. 2025) : wallet identity, discovery d’API, chaînes additionnelles, SDK modulaire
- **A2A x402** : extension pour paiements crypto dans écosystèmes d’agents décentralisés

---

## 2. Protocoles de communication inter-agents

### Vue d’ensemble

| Protocole                              | Rôle principal                                                        | Usage typique                                       |
| -------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| **MCP** (Model Context Protocol)       | JSON-RPC client-serveur, appels d’outils et échange de données typées | Intégration d’outils, contexte partagé              |
| **ACP** (Agent Communication Protocol) | HTTP REST, messages multipart MIME, sessions, routing                 | Communication générique entre agents                |
| **A2A** (Agent-to-Agent)               | P2P, délégation de tâches via Agent Cards, capacités                  | Collaboration sécurisée sans partage d’état/mémoire |
| **ANP** (Agent Network Protocol)       | Découverte réseau, identifiants W3C, graphes JSON-LD                  | Réseaux ouverts d’agents                            |

### Choix selon le cas

- **Monétisation API pour agents** : x402 + A2A (paiement + délégation)
- **Outillage et contexte** : MCP
- **Workflows multi-agents complexes** : ACP ou A2A selon niveau de couplage
- **Discovery et identité décentralisée** : ANP

---

## 3. Smart contracts pour relations KOL / Agency

### Modèles dominants

| Modèle                   | Mécanisme                                                       | Intérêt                                |
| ------------------------ | --------------------------------------------------------------- | -------------------------------------- |
| **Revenue-share**        | Commission sur actions réelles (signups, swaps, mints, staking) | Alignement des incitations             |
| **Affiliate / referral** | Tracking on-chain des conversions par créateur                  | Attribution vérifiable                 |
| **Attribution on-chain** | Mesure de performance via données blockchain                    | ~40 % ROI en plus vs fee fixe par post |

### Composants techniques

1. **Attribution** : analytics (Nansen, Dune), tagging on-chain (Arkham), graphes sociaux
2. **Exécution** : smart contract pour règles de commission, seuils, échéances
3. **Settlement** : paiement automatique sur preuve d’action on-chain

### Logique contractuelle type

```
Si [action_utilisateur vérifiée on-chain] ET [KOL identifié]
  → Calcul commission selon règles (%, paliers, etc.)
  → Release fonds vers wallet KOL/Agency
```

### Risques à couvrir

- Fraude (fausses actions, sybil)
- Désaccord sur les métriques d’attribution
- Liquidité et délais de settlement

---

## 4. Patterns de gouvernance agentique

### Checklist pour un flux agentic payant

- [ ] Protocole inter-agents défini (A2A, MCP, etc.)
- [ ] Intégration x402 ou équivalent pour paiement autonome
- [ ] Règles d’attribution et de commission formalisées
- [ ] Mécanisme de dispute (arbitrage, oracle)

### Checklist pour un contrat KOL/Agency

- [ ] Métriques d’attribution mesurables on-chain
- [ ] Structure revenue-share ou affiliate définie
- [ ] Conditions de release (seuils, délais, audits)
- [ ] Clause de dispute et résiliation

---

## Ressources additionnelles

- Spécification x402 : https://www.x402.org/
- A2A Protocol : https://a2a-protocol.org/
- A2A x402 (Google) : https://github.com/google-agentic-commerce/a2a-x402
