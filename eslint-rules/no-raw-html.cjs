/**
 * Custom ESLint rules to flag raw-HTML-insertion patterns.
 *
 *   no-dangerously-set-inner-html  – warn on JSX dangerouslySetInnerHTML
 *   no-raw-inner-html              – error on .innerHTML assignment
 */

/** @type {import('eslint').Rule.RuleModule} */
const noDangerouslySetInnerHTML = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow dangerouslySetInnerHTML (flag for manual review of sanitization)',
    },
    schema: [],
    messages: {
      dangerous:
        'dangerouslySetInnerHTML detected. Ensure the value is sanitized with a library like DOMPurify or is trusted static content. Add an eslint-disable comment with justification if intentional.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === 'dangerouslySetInnerHTML') {
          context.report({ node, messageId: 'dangerous' })
        }
      },
    }
  },
}

/** @type {import('eslint').Rule.RuleModule} */
const noRawInnerHtml = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow .innerHTML assignment to prevent raw HTML injection',
    },
    schema: [],
    messages:
      { raw: 'innerHTML assignment detected. Use textContent or DOM APIs (createElement + textContent) instead.' },
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        if (
          node.left.type === 'MemberExpression' &&
          !node.left.computed &&
          node.left.property.type === 'Identifier' &&
          node.left.property.name === 'innerHTML'
        ) {
          context.report({ node, messageId: 'raw' })
        }
      },
    }
  },
}

module.exports = { noDangerouslySetInnerHTML, noRawInnerHtml }
