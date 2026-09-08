# Your code

Everything in `src/custom/` belongs to you. Reactively never overwrites it.

```text
src/
├── generated/   Reactively owns this. Regenerated on every build; edits are lost.
├── runtime/     Reactively component wrappers. Shared; edit only if you know why.
└── custom/      You own this.
    ├── components/   your own React Native components
    ├── functions/    business logic called from Reactively actions
    ├── hooks/        custom hooks
    └── services/     API clients, SDK wrappers
```

Reference custom code from the editor rather than editing generated files: a custom
function can be attached to an event, and a custom component can be registered so it
appears alongside the built-in ones. Changes made directly in `src/generated/` disappear
the next time you press build.
