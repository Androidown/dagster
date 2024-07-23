import {gql} from '@apollo/client';

export const TABLE_SCHEMA_FRAGMENT = gql`
  fragment TableSchemaFragment on TableSchema {
    columns {
      name
      description
      type
      constraints {
        ...ConstraintsForTableColumn
      }
    }
    constraints {
      other
    }
  }

  fragment ConstraintsForTableColumn on TableColumnConstraints {
    nullable
    unique
    other
  }
`;
