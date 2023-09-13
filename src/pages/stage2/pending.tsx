import { ActionIcon, Button, Center, Group, Loader } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const Page = () => {
  const utils = api.useContext();

  const stage = api.stage2.stageGetPending.useQuery(undefined, {
    keepPreviousData: false,
  });
  const stageDelete = api.stage2.stageDeletePending.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGetPending.invalidate();
    },
  });
  const stageDeleteAll = api.stage2.stageDeleteAllPending.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGetPending.invalidate();
    },
  });
  const stageRunPending = api.stage2.stageRunPending.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGetPending.invalidate();
    },
  });

  if (stage.isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }
  if (stage.isError) {
    return (
      <Center h="100%">
        <CustomError message={stage.error.message} />
      </Center>
    );
  }

  return (
    <>
      {stageDeleteAll.isError && (
        <CustomError message={stageDeleteAll.error.message} />
      )}

      <Group mb="lg">
        <Button
          disabled={stage.data == undefined || stage.data.length == 0}
          color="red"
          onClick={() => {
            stageDeleteAll.mutate();
          }}
          loading={stageDeleteAll.isLoading}
        >
          Delete All {`(${stage.data?.length})`}
        </Button>
        <Button
          disabled={stage.data == undefined || stage.data.length == 0}
          color="green"
          onClick={() => {
            stageRunPending.mutate();
          }}
          loading={stageRunPending.isLoading}
        >
          Run Tests
        </Button>
      </Group>
      <CustomTable
        headers={['updatedAt', 'username', 'hostedLink', 'email']}
        data={stage.data.map(user => ({
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
                    onClick={() => stageDelete.mutate({ email: user.email })}
                    loading={
                      stageDelete.variables?.email === user.email &&
                      stageDelete.isLoading
                    }
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
