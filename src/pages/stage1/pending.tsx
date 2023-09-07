import { Button, Center, Container, Group, Loader } from '@mantine/core';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const Page = () => {
  const utils = api.useContext();

  const stage1 = api.stages.stage1GetPending.useQuery(undefined, {
    keepPreviousData: false,
  });
  const stage1Delete = api.stages.stage1DeletePending.useMutation({
    onSuccess: async () => {
      await utils.stages.stage1GetPending.invalidate();
    },
  });
  const stage1RunPending = api.stages.stage1RunPending.useMutation({
    onSuccess: async () => {
      await utils.stages.stage1GetPending.invalidate();
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
    <Container>
      {stage1Delete.isError && (
        <CustomError message={stage1Delete.error.message} />
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
            stage1Delete.mutate();
          }}
          loading={stage1Delete.isLoading}
        >
          Delete All {`(${stage1.data?.length})`}
        </Button>
      </Group>
      <CustomTable
        headers={['username', 'hostedLink', 'email']}
        data={stage1.data}
      >
        {users => {
          return users.map(user => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.hostedLink}</td>
              <td>{user.email}</td>
            </tr>
          ));
        }}
      </CustomTable>
    </Container>
  );
};

export default Page;
