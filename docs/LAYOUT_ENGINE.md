# Reactively Layout Engine

## Goal

The Reactively layout engine should visually represent React Native layout semantics closely enough that the editor, web preview, and generated native application agree without code-generation guesswork.

Reactively is not a drawing program. Every visual position should come from an explicit layout rule.

## Supported Layout Modes

The beta should focus on React Native Flexbox plus absolute positioning.

Supported properties:

```text
position
left / right / top / bottom
width / height
min/max width / height
flexDirection
justifyContent
alignItems
alignSelf
flexWrap
flex
flexGrow
flexShrink
flexBasis
margin
padding
gap / rowGap / columnGap
overflow
```

## Hierarchy

Every rendered node belongs to a tree.

```text
Screen
└── SafeAreaView
    └── View
        ├── Text
        ├── TextInput
        └── Button
```

Child layout is always computed relative to the parent.

## Relative vs Absolute

### Relative

The element participates in its parent's flex layout.

Arbitrary X/Y dragging should not become the source of truth for relative children.

Canvas interaction for relative items should favor:

- sibling reorder
- parent layout controls
- margin
- padding
- alignment
- flex properties

### Absolute

The element is removed from normal flex flow and positioned relative to its containing parent.

Canvas dragging may directly edit `left` / `top` values.

## Layout Calculation Pipeline

```text
Project Document
      ↓
Normalize style values
      ↓
Build layout tree
      ↓
Compute node geometry
      ↓
ComputedLayoutNode[]
      ↓
Canvas Renderer
```

Recommended shape:

```ts
interface ComputedLayoutNode {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contentBox: Rect;
  clippingRect?: Rect;
}
```

Keep this package free of Electron and DOM dependencies.

## Yoga Compatibility

React Native uses Yoga for layout. Reactively should aim to use Yoga-compatible semantics and should investigate using Yoga directly in the editor rather than reimplementing Flexbox indefinitely.

For beta, a limited internal implementation is acceptable if the supported subset is clearly defined and validated against real React Native output.

Do not claim support for properties the editor cannot reproduce correctly.

## Canvas Coordinate System

Keep document units independent from display zoom.

```text
Document coordinates
      ↓
Viewport transform
      ↓
Screen pixels
```

Required transforms:

- document -> viewport
- viewport -> document
- parent-local -> document
- document -> parent-local

Reparenting should use these conversions to preserve visual position where possible.

## Snapping Engine

Snapping should be a separate subsystem.

Inputs:

```ts
interface SnapRequest {
  movingBounds: Rect;
  parentBounds: Rect;
  siblingBounds: Rect[];
  gridSize?: number;
  threshold: number;
}
```

Outputs:

```ts
interface SnapResult {
  correctedX: number;
  correctedY: number;
  guides: SnapGuide[];
}
```

Initial snap targets:

- parent edges
- parent horizontal/vertical center
- sibling edges
- sibling centers
- equal spacing
- configurable grid

## Alignment Guides

Guides are ephemeral editor state, never project state.

Show:

- matching edges
- center alignment
- spacing measurements
- parent padding
- distance between nodes

## Overflow and Clipping

Parent bounds do not automatically constrain absolute children.

Respect parent `overflow` semantics:

```text
visible -> child may render outside parent
hidden  -> outside content clipped
scroll  -> scrolling behavior where component supports it
```

## Sizing

Avoid CSS units unsupported by React Native.

Supported layout values should initially be:

```text
points
percent
auto
```

Do not support arbitrary `px`, `vw`, `vh`, `rem`, or calc expressions as canonical project values.

## Cross-Platform Validation

Create fixture layouts and compare them against:

- editor layout
- React Native Web preview
- iOS native
- Android native

Examples should include:

- nested rows/columns
- percentage widths
- flex grow/shrink
- nested padding/margins
- absolute children
- overflow hidden
- safe area wrappers

The layout engine is foundational and must be tested continuously against actual React Native rendering.
