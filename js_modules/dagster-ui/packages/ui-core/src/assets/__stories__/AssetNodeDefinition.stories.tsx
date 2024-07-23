import {MockedProvider} from '@apollo/client/testing';
import {Meta} from '@storybook/react';

import {
  buildAssetKey,
  buildAssetNode,
  buildAutoMaterializePolicy,
  buildCompositeConfigType,
  buildConfigTypeField,
  buildFreshnessPolicy,
  buildIntMetadataEntry,
  buildPathMetadataEntry,
  buildResourceRequirement,
} from '../../graphql/types';
import {AssetNodeDefinition} from '../AssetNodeDefinition';

// eslint-disable-next-line import/no-default-export
export default {
  title: 'Asset Details/Definition',
  component: AssetNodeDefinition,
} as Meta;

export const MinimalAsset = () => {
  return (
    <MockedProvider>
      <AssetNodeDefinition
        dependsOnSelf={false}
        downstream={[]}
        upstream={[]}
        assetNode={
          buildAssetNode({
            description: null,
            freshnessPolicy: null,
            autoMaterializePolicy: null,
            metadataEntries: [],
          }) as any
        }
      />
    </MockedProvider>
  );
};

export const FullUseAsset = () => {
  return (
    <MockedProvider>
      <AssetNodeDefinition
        dependsOnSelf={true}
        upstream={[buildAssetNode({assetKey: buildAssetKey({path: ['upstream']})})]}
        downstream={[
          buildAssetNode({assetKey: buildAssetKey({path: ['downstream_1']})}),
          buildAssetNode({assetKey: buildAssetKey({path: ['downstream_2']})}),
        ]}
        assetNode={
          buildAssetNode({
            description: `
            # Welcome 
            
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
            
            ## Markdown
            
            The sql query I used was:

            \`\`\`sql
            SELECT 
                COUNT(*)
            FROM ability_viewed_then_completed_grouped 
            WHERE 
                ability_viewed_then_completed_grouped."lastViewElapsedTime" < interval '12 hours' 
                AND "completedAt" >= '2023-04-01' AND "completedAt" < '2023-05-01'
            GROUP BY address;
            \`\`\`
            `,
            freshnessPolicy: buildFreshnessPolicy(),
            autoMaterializePolicy: buildAutoMaterializePolicy(),
            requiredResources: [
              buildResourceRequirement({
                resourceKey: 's3',
              }),
              buildResourceRequirement({
                resourceKey: 'redshift_prod',
              }),
            ],
            configField: buildConfigTypeField({
              configType: buildCompositeConfigType({
                fields: [],
              }),
            }),
            metadataEntries: [buildIntMetadataEntry({}), buildPathMetadataEntry()],
          }) as any
        }
      />
    </MockedProvider>
  );
};
