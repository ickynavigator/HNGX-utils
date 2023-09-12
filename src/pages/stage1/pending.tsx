import { ActionIcon, Button, Center, Group, Loader } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const Page = () => {
  const utils = api.useContext();

  const stage1 = api.stage1.stageGetPending.useQuery(undefined, {
    keepPreviousData: false,
  });
  const stage1Delete = api.stage1.stageDeletePending.useMutation({
    onSuccess: async () => {
      await utils.stage1.stageGetPending.invalidate();
    },
  });
  const stage1DeleteAll = api.stage1.stageDeleteAllPending.useMutation({
    onSuccess: async () => {
      await utils.stage1.stageGetPending.invalidate();
    },
  });
  const stage1RunPending = api.stage1.stageRunPending.useMutation({
    onSuccess: async () => {
      await utils.stage1.stageGetPending.invalidate();
    },
  });

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
    <>
      {stage1DeleteAll.isError && (
        <CustomError message={stage1DeleteAll.error.message} />
      )}

      <Group mb="lg">
        <Button
          disabled={stage1.data == undefined || stage1.data.length == 0}
          color="green"
          onClick={() => {
            stage1RunPending.mutate();
          }}
          loading={stage1RunPending.isLoading}
        >
          Run Tests
        </Button>
        <Button
          disabled={stage1.data == undefined || stage1.data.length == 0}
          color="red"
          onClick={() => {
            stage1DeleteAll.mutate();
          }}
          loading={stage1DeleteAll.isLoading}
        >
          Delete All {`(${stage1.data?.length})`}
        </Button>
      </Group>
      <CustomTable
        headers={['updatedAt', 'username', 'hostedLink', 'email']}
        data={stage1.data.map(user => ({
          ...user,
          updatedAt: new Date(user.updatedAt).toLocaleString(),
        }))}
        showActionsRow
      >
        {users => {
          return users.map(user => (
            <tr key={user.username}>
              <td>{user.updatedAt}</td>
              <td>{user.username}</td>
              <td>{user.hostedLink}</td>
              <td>{user.email}</td>
              <td>
                <Group position="right">
                  <ActionIcon
                    color="red"
                    onClick={() => stage1Delete.mutate({ email: user.email })}
                    loading={stage1Delete.isLoading}
                  >
                    <IconTrash />
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          ));
        }}
      </CustomTable>
    </>
  );
};

export default Page;
