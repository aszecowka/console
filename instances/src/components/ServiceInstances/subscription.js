import gql from 'graphql-tag';

export const SERVICE_INSTANCES_SUBSCRIPTION = gql`
  subscription onServiceInstance($environment: String!) {
    serviceInstanceEvent(environment: $environment) {
      type
      instance {
        name
        labels
        servicePlanSpec
        status {
          type
          message
        }
        serviceClass {
          displayName
          externalName
          name
        }
        servicePlan {
          displayName
          externalName
          name
        }
        serviceBindingUsages {
          name
        }
      }
    }
  }
`;
