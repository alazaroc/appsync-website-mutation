import gql from 'graphql-tag';

export const GET_NOTIFICATIONS = gql`
  query listNotifications(
    $filter: TableNotificationsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listNotifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        notificationId
        userId
        message
        timestamp
      }
      nextToken
    }
  }
`;

export const ADD_NOTIFICATION = gql`
  mutation createNotifications($input: CreateNotificationsInput!) {
    createNotifications(input: $input) {
      notificationId
      userId
      message
      timestamp
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation deleteNotifications($input: DeleteNotificationsInput!) {
    deleteNotifications(input: $input) {
      notificationId
      userId
      message
      timestamp
    }
  }
`;

export const UPDATE_NOTIFICATION = gql`
  mutation updateNotifications($input: UpdateNotificationsInput!) {
    updateNotifications(input: $input) {
      notificationId
      userId
      message
      timestamp
    }
  }
`;

export const SUBSCRIBE_TO_NEW_NOTIFICATIONS = gql`
  subscription onCreateNotifications {
    onCreateNotifications {
      notificationId
      userId
      message
      timestamp
    }
  }
`;
