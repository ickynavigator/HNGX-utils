import {
  ActionIcon,
  Button,
  Center,
  Container,
  Group,
  Loader,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const results = () => {
  const stage1 = api.stages.stage1GetFailed.useQuery();
  const deleteStage1Failed = api.stages.stage1DeleteFailed.useMutation();
  const deleteStage1FailedAll = api.stages.stage1DeleteAllFailed.useMutation();

  if (stage1.isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }
  if (stage1.isError) {
    return (
      <Center h="100%">
        <CustomError message={stage1.error.message} />
      </Center>
    );
  }

  return (
    <Container>
      <Group>
        <Button
          disabled={stage1.data == undefined || stage1.data.length == 0}
          color="red"
          onClick={() => {
            deleteStage1FailedAll.mutate();
          }}
        >
          Delete all
        </Button>
      </Group>
      <CustomTable
        headers={['username', 'hostedLink', 'email', 'grade']}
        data={stage1.data}
        showActionsRow
      >
        {users => {
          return users.map(user => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.hostedLink}</td>
              <td>{user.email}</td>
              <td>{user.grade}</td>
              <td>
                <Group position="right">
                  <ActionIcon
                    color="red"
                    onClick={() =>
                      deleteStage1Failed.mutate({ username: user.username })
                    }
                    loading={deleteStage1Failed.isLoading}
                  >
                    <IconTrash />
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          ));
        }}
      </CustomTable>
    </Container>
  );
};

export default results;
