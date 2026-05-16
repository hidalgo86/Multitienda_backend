import {
  ASTVisitor,
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  SelectionSetNode,
  ValidationContext,
} from 'graphql';

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_FIELDS = 80;

function getMaxDepth(selectionSet: SelectionSetNode | undefined): number {
  if (!selectionSet) return 0;

  return selectionSet.selections.reduce((maxDepth, selection) => {
    if (selection.kind === Kind.FIELD) {
      return Math.max(maxDepth, 1 + getMaxDepth(selection.selectionSet));
    }

    if (
      selection.kind === Kind.INLINE_FRAGMENT ||
      selection.kind === Kind.FRAGMENT_SPREAD
    ) {
      return Math.max(maxDepth, 1);
    }

    return maxDepth;
  }, 0);
}

function countFields(selectionSet: SelectionSetNode | undefined): number {
  if (!selectionSet) return 0;

  return selectionSet.selections.reduce((total, selection) => {
    if (selection.kind === Kind.FIELD) {
      return total + 1 + countFields(selection.selectionSet);
    }

    return total + 1;
  }, 0);
}

export function graphQLSecurityRule(context: ValidationContext): ASTVisitor {
  const maxDepth = Number(process.env.GRAPHQL_MAX_DEPTH) || DEFAULT_MAX_DEPTH;
  const maxFields =
    Number(process.env.GRAPHQL_MAX_FIELDS) || DEFAULT_MAX_FIELDS;

  return {
    OperationDefinition(node: OperationDefinitionNode) {
      const depth = getMaxDepth(node.selectionSet);
      const fields = countFields(node.selectionSet);

      if (depth > maxDepth) {
        context.reportError(
          new GraphQLError(
            `GraphQL query depth limit exceeded: ${depth}/${maxDepth}`,
            { nodes: node },
          ),
        );
      }

      if (fields > maxFields) {
        context.reportError(
          new GraphQLError(
            `GraphQL field limit exceeded: ${fields}/${maxFields}`,
            { nodes: node },
          ),
        );
      }
    },
  };
}
