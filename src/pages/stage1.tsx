import {
  ActionIcon,
  Button,
  Container,
  Group,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import CustomDropzone from '~/components/Dropzone';
import CustomTable from '~/components/Table';
import { api, type RouterInputs } from '~/utils/api';
import { parseCsv } from '~/utils/csvHelpers';

type Users = RouterInputs['stages']['stage1'];

const Page = () => {
  const stage1 = api.stages.stage1.useMutation();

  const form = useForm<Users>({
    initialValues: {
      users: [],
    },
  });

  const addUser = (user: Users['users'][number]) => {
    if (form.values.users.find(u => u.username === user.username)) return;
    form.setFieldValue('users', [...form.values.users, user]);
  };
  const removeUser = (username: Users['users'][number]['username']) => {
    form.setFieldValue(
      'users',
      form.values.users.filter(user => user.username !== username),
    );
  };

  const handleDownload = (data: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'users.csv');
    document.body.appendChild(a);
    a.click();
    return;
  };

  return (
    <Container py="xl">
      <Title>Stage 1 tests</Title>

      <CustomDropzone
        onDrop={files => {
          const reader = new FileReader();
          const users: Users['users'] = [];

          reader.onload = e => {
            const csv = e?.target?.result;
            if (typeof csv === 'string') {
              const results = parseCsv<keyof Users['users'][number]>({
                data: csv,
                headerExists: true,
              });
              results.forEach(result => {
                if (result !== null && Object.keys(result).length > 0) {
                  console.log(result);
                  users.push(result);
                }
              });
            }

            users.reverse().forEach(user => addUser(user));
          };

          files.forEach(file => reader.readAsText(file));
        }}
      >
        <Text size="xl" inline>
          Drag CSV file here (or click here to select)
        </Text>
        <Text size="sm" color="dimmed" inline mt={7}>
          Attach only 1 file. The file should not exceed 5mb
        </Text>
      </CustomDropzone>

      {form.values.users.length > 0 && (
        <>
          <Group position="right" mb="xl">
            {(['passed', 'pending', 'failed'] as const).map(type => {
              return (
                <Button
                  key={type}
                  disabled={
                    stage1.data == undefined || stage1.data[type].length === 0
                  }
                  color="green"
                  onClick={() => {
                    if (stage1.data == undefined) return;
                    handleDownload(stage1.data[type]);
                  }}
                >
                  Download {type}
                </Button>
              );
            })}

            <Button
              onClick={() => stage1.mutate(form.values)}
              loading={stage1.isLoading}
            >
              Run Tests
            </Button>
          </Group>

          <CustomTable
            headers={['username', 'hostedLink', 'email']}
            data={form.values.users}
            showActionsRow
          >
            {users => {
              return users.map(user => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.hostedLink}</td>
                  <td>{user.email}</td>
                  <td>
                    <Group position="right">
                      <ActionIcon
                        color="red"
                        onClick={() => removeUser(user.username)}
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
      )}
    </Container>
  );
};

export default Page;
