import { ActionIcon, Button, Group, Text, Title } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import { z } from 'zod';
import CustomDropzone from '~/components/Dropzone';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';
import { parseCsv } from '~/utils/csvHelpers';
import { exportSchema } from '~/utils/general';

const userSchema = exportSchema.pick({ username: true });
type UserSchema = z.infer<typeof userSchema>;

const usersSchema = z.object({
  users: z.array(userSchema).min(1),
});
type UsersSchema = z.infer<typeof usersSchema>;

const Page = () => {
  const upload = api.tools.uploadGeneral.useMutation();

  const form = useForm<UsersSchema>({
    initialValues: {
      users: [],
    },
    validate: zodResolver(usersSchema),
  });

  const addUser = (user: UserSchema) => {
    form.insertListItem('users', user);
  };
  const removeUser = (username: UserSchema['username']) => {
    const users = form.values.users.filter(user => user.username !== username);
    form.setFieldValue('users', users);
  };

  return (
    <>
      <Title>General - Upload all</Title>

      {form.errors.users && <CustomError message={form.errors.users} />}
      {upload.isError && <CustomError message={upload.error.message} />}

      <CustomDropzone
        onDrop={files => {
          const reader = new FileReader();
          const users: UsersSchema['users'] = [];

          reader.onload = e => {
            const csv = e?.target?.result;
            if (typeof csv === 'string') {
              const results = parseCsv<keyof UserSchema>({
                data: csv,
                headerExists: true,
              });
              results.forEach(result => {
                if (result !== null && Object.keys(result).length > 0) {
                  const parsed = userSchema.safeParse(result);
                  if (parsed.success) {
                    users.push({ username: parsed.data.username });
                  }
                }
              });
            }

            users.forEach(user => addUser(user));
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
            <Button
              color="yellow"
              onClick={() => {
                form.setFieldValue('users', []);
              }}
            >
              Clear all
            </Button>

            <Button
              onClick={() => upload.mutate(form.values)}
              loading={upload.isLoading}
            >
              Upload Members {`(${form.values.users.length})`}
            </Button>
          </Group>
          <CustomTable
            headers={['username']}
            data={form.values.users}
            showActionsRow
          >
            {users => {
              return users.map(user => (
                <tr key={user.username}>
                  <td>{user.username}</td>
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
    </>
  );
};

export default Page;
