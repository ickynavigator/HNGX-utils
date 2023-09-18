import { Button, Center, Group, Loader } from '@mantine/core';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { useConfirmationModal } from '~/hooks/useConfirmationModal';
import { api } from '~/utils/api';

const Page = () => {
  const utils = api.useContext();
  const general = api.tools.getGeneral.useQuery();
  const deleteAll = api.tools.deleteGeneral.useMutation({
    onSuccess: async () => {
      await utils.tools.getGeneral.invalidate();
    },
  });

  const confirmDelete = useConfirmationModal(() => {
    deleteAll.mutate();
  });

  if (general.isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }
  if (general.isError) {
    return (
      <Center h="100%">
        <CustomError message={general.error.message} />
      </Center>
    );
  }

  return (
    <>
      {general.data.length > 0 && (
        <>
          <Group position="right" mb="xl">
            <Button
              onClick={confirmDelete}
              loading={deleteAll.isLoading}
              color="red"
            >
              Delete All - {general.data?.length}
            </Button>
          </Group>
          <CustomTable headers={['username']} data={general.data}>
            {users => {
              return users.map(user => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                </tr>
              ));
            }}
          </CustomTable>
        </>
      )}
    </>
  );
};

export default Page;
