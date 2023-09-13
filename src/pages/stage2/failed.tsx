import { ActionIcon, Button, Center, Group, Loader } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const Page = () => {
  const utils = api.useContext();

  const stage = api.stage2.stageGetFailed.useQuery();
  const deleteStageFailed = api.stage2.stageDeleteFailed.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGetFailed.invalidate();
    },
  });
  const deleteStageFailedAll = api.stage2.stageDeleteAllFailed.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGetFailed.invalidate();
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

  const handleDownload = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    return;
  };

  const handleCSVdownload = () => {
    const data = `username,email,hostedLink,grade\n ${stage.data
      .map(
        v =>
          `${v.username.trim()},${v.email.trim()},${v.hostedLink.trim()},${
            v.grade
          }`,
      )
      .join('\n')}`;

    handleDownload(data, 'failed');
  };

  return (
    <>
      <Group mb="lg">
        <Button
          disabled={stage.data == undefined || stage.data.length == 0}
          color="red"
          onClick={() => {
            deleteStageFailedAll.mutate();
          }}
          loading={deleteStageFailedAll.isLoading}
        >
          Delete all - {`(${stage.data?.length})`}
        </Button>
        <Button
          disabled={stage.data == undefined || stage.data.length == 0}
          onClick={() => {
            handleCSVdownload();
          }}
        >
          Download CSV
        </Button>
      </Group>
      <CustomTable
        headers={['updatedAt', 'username', 'hostedLink', 'email', 'grade']}
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
              <td>{user.grade}</td>
              <td>
                <Group position="right">
                  <ActionIcon
                    color="red"
                    onClick={() =>
                      deleteStageFailed.mutate({ email: user.email })
                    }
                    loading={
                      deleteStageFailed.variables?.email === user.email &&
                      deleteStageFailed.isLoading
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
