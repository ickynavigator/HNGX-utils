import { Button, Center, Group, Loader } from '@mantine/core';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const results = () => {
  const utils = api.useContext();

  const stage1 = api.stages.stage1Get.useQuery();
  const deleteStage1Result = api.stages.stage1DeleteAllPassed.useMutation({
    onSuccess: async () => {
      await utils.stages.stage1Get.invalidate();
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
          onClick={() => {
            deleteStage1Result.mutate();
          }}
          loading={deleteStage1Result.isLoading}
        >
          Delete all
        </Button>
        <Button
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
      >
        {users => {
          return users.map(user => (
            <tr key={user.username}>
              <td>{user.updatedAt}</td>
              <td>{user.username}</td>
              <td>{user.hostedLink}</td>
              <td>{user.email}</td>
              <td>{user.grade}</td>
            </tr>
          ));
        }}
      </CustomTable>
    </>
  );
};

export default results;
