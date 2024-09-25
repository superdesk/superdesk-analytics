## Front-end checklist

<!--- Go over all the following points, and put an `x` in all the boxes that apply. -->
- [ ] This pull request is replacing `lodash.get` with optional chaining and nullish coalescing for modified code segments
- [ ] This pull request is adding missing TypeScript types to modified code segments where it's easy to do so with confidence
- [ ] This pull request is using `memo` or `PureComponent` to define new React components (and updates existing usages in modified code segments)
- [ ] This pull request is not importing anything from client-core directly (use `superdeskApi`)
- [ ] This pull request is importing UI components from `superdesk-ui-framework` and `superdeskApi` when possible instead of using ones defined in this repository.
