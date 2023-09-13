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
import { api } from '~/utils/api';

const Page = () => {
  const theme = useMantineTheme();
  const utils = api.useContext();
  const stage = api.stage2.stageGet.useQuery({ query: { promoted: false } });

  const promoteAllStage = api.stage2.stagePromoteAll.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGet.invalidate();
    },
  });
  const promoteSpecificStage = api.stage2.stagePromoteSpecific.useMutation({
    onSuccess: async () => {
      await utils.stage2.stageGet.invalidate();
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
    const data = `username,email,grade\n ${stage.data
      .map(v => `${v.username.trim()},${v.email.trim()},${v.grade}`)
      .join('\n')}`;

    handleDownload(data, 'passed');
  };

  return (
    <>
      <Group mb="lg">
        <Button
          onClick={() => {
            handleCSVdownload();
          }}
        >
          Download CSV - {`(${stage.data?.length})`}
        </Button>
        <Button
          onClick={() => {
            promoteAllStage.mutate({ query: { promoted: false } });
          }}
          color="green"
          loading={promoteAllStage.isLoading}
        >
          Mark all as promoted
        </Button>
      </Group>
      <CustomTable
        headers={['updatedAt', 'username', 'hostedLink', 'email', 'grade']}
        data={stage.data.map(user => ({
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
                <Group position="center">
                  <ActionIcon
                    color="green"
                    variant="filled"
                    loading={
                      promoteSpecificStage.isLoading &&
                      promoteSpecificStage.variables?.emails.includes(
                        user.email,
                      )
                    }
                    disabled={user.promoted === 'Yes'}
                    onClick={() =>
                      promoteSpecificStage.mutate({ emails: [user.email] })
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
