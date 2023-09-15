import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  useMantineTheme,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { useConfirmationModal } from '~/hooks/useConfirmationModal';
import { api } from '~/utils/api';

const Page = () => {
  const theme = useMantineTheme();
  const utils = api.useContext();
  const stage1 = api.stage1.stageGet.useQuery();
  const deleteStage1Result = api.stage1.stageDeleteAllPassed.useMutation({
    onSuccess: async () => {
      await utils.stage1.stageGet.invalidate();
    },
  });
  const promoteAllStage1 = api.stage1.stagePromoteAll.useMutation({
    onSuccess: async () => {
      await utils.stage1.stageGet.invalidate();
    },
  });
  const promoteSpecificStage1 = api.stage1.stagePromoteSpecific.useMutation({
    onSuccess: async () => {
      await utils.stage1.stageGet.invalidate();
    },
  });

  const confirmDelete = useConfirmationModal(() => {
    deleteStage1Result.mutate();
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
    const data = `username,email,grade\n ${stage1.data
      .map(v => `${v.username.trim()},${v.email.trim()},${v.grade}`)
      .join('\n')}`;

    handleDownload(data, 'passed');
  };

  return (
    <>
      <Group mb="lg">
        <Button
          disabled={stage1.data == undefined || stage1.data.length == 0}
          color="red"
          onClick={confirmDelete}
          loading={deleteStage1Result.isLoading}
        >
          Delete all - {`(${stage1.data?.length})`}
        </Button>
        <Button
          onClick={() => {
            handleCSVdownload();
          }}
        >
          Download CSV
        </Button>
        <Button
          onClick={() => {
            promoteAllStage1.mutate();
          }}
          color="green"
          loading={promoteAllStage1.isLoading}
        >
          Mark all as promoted
        </Button>
      </Group>
      <CustomTable
        headers={['updatedAt', 'username', 'hostedLink', 'email', 'grade']}
        data={stage1.data.map(user => ({
          ...user,
          updatedAt: new Date(user.updatedAt).toLocaleString(),
          promoted: user.promoted ? 'Yes' : 'No',
        }))}
        showActionsRow
      >
        {users => {
          return users.map(user => (
            <tr
              key={user.username}
              style={{
                backgroundColor:
                  user.promoted === 'Yes'
                    ? theme.colors.green[3]
                    : theme.colors.yellow[0],
              }}
            >
              <td>{user.updatedAt}</td>
              <td>{user.username}</td>
              <td>{user.hostedLink}</td>
              <td>{user.email}</td>
              <td>{user.grade}</td>
              <td>
                <Group position="center" grow>
                  <ActionIcon
                    color="green"
                    variant="filled"
                    loading={promoteSpecificStage1.isLoading}
                    disabled={user.promoted === 'Yes'}
                    onClick={() =>
                      promoteSpecificStage1.mutate({ emails: [user.email] })
                    }
                  >
                    <IconCheck />
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
