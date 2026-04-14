# Graph Report - .  (2026-04-14)

## Corpus Check
- 12 files · ~7,018 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 25 nodes · 28 edges · 7 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `startServer()` - 8 edges
2. `authenticateToken()` - 7 edges
3. `calculateMatchScore()` - 3 edges
4. `checkTimeOverlap()` - 2 edges
5. `runMatching()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (2): authenticateToken(), startServer()

### Community 1 - "Community 1"
Cohesion: 0.83
Nodes (3): calculateMatchScore(), checkTimeOverlap(), runMatching()

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 1.0
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 4`** (2 nodes): `smoke.js`, `runSmokeTest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (1 nodes): `bug-condition.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (1 nodes): `setup.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `startServer()` connect `Community 0` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Why does `authenticateToken()` connect `Community 0` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._