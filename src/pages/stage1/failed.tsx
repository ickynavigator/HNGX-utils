import { ActionIcon, Button, Center, Group, Loader } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const results = () => {
  const utils = api.useContext();

  const stage1 = api.stages.stage1GetFailed.useQuery();
  const deleteStage1Failed = api.stages.stage1DeleteFailed.useMutation({
    onSuccess: async () => {
      await utils.stages.stage1GetFailed.invalidate();
    },
  });
  const deleteStage1FailedAll = api.stages.stage1DeleteAllFailed.useMutation({
    onSuccess: async () => {
      await utils.stages.stage1GetFailed.invalidate();
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
    const data = `username,email,hostedLink,grade\n ${stage1.data
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
          disabled={stage1.data == undefined || stage1.data.length == 0}
          color="red"
          onClick={() => {
            deleteStage1FailedAll.mutate();
          }}
          loading={deleteStage1FailedAll.isLoading}
        >
          Delete all
        </Button>
        <Button
          disabled={stage1.data == undefined || stage1.data.length == 0}
          onClick={() => {
            handleCSVdownload();
          }}
        >
          Download {`(${stage1.data?.length})`}
        </Button>
      </Group>
      <CustomTable
        headers={['updatedAt', 'username', 'hostedLink', 'email', 'grade']}
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
    </>
  );
};

export default results;
