# Resume Parser System

This directory contains parsers for different file formats that convert various resume structures into our internal Resume data model.

## Parser Normalization

All parsers now use a unified normalization system implemented in `parser-utils.ts`. This system ensures that regardless of the source format (plaintext, markdown, JSON, YAML), all data is stored in a consistent manner.

### Key Principles

1. **Field Prioritization**: 
   - All list-like data (including skills, bullet points, etc.) is normalized to use the `details` field
   - Data from `content` and `tags` fields is merged into `details` during parsing

2. **Data Consistency**:
   - Downstream components (like the PDF generator) can expect data to be in the `details` field
   - No need to check multiple fields for the same type of content

## Parsing Process

1. The format-specific parser (plaintext, markdown, JSON, or YAML) converts the raw content to a base Resume structure
2. The `ParserNormalizer` then processes each item to standardize the field usage
3. The normalized Resume object is returned with all list-like data consistently stored in the `details` field

## Adding a New Parser

When adding a new parser:

1. Create a new parser file in this directory
2. Implement the parsing logic to convert raw content to the Resume structure
3. Ensure your parser is added to `src/lib/parser.ts`
4. The normalization will be automatically applied

## Testing

When testing parsers, verify that list items are correctly being stored in the `details` field, regardless of the source format. 