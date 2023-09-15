import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  createStyles,
  rem,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import { z } from 'zod';
import CustomDropzone from '~/components/Dropzone';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';
import { parseCsv } from '~/utils/csvHelpers';

const useStyles = createStyles(theme => ({
  root: {
    position: 'relative',
  },

  input: {
    height: rem(54),
    paddingTop: rem(18),
  },

  label: {
    position: 'absolute',
    pointerEvents: 'none',
    fontSize: theme.fontSizes.xs,
    paddingLeft: theme.spacing.sm,
    paddingTop: `calc(${theme.spacing.sm} / 2)`,
    zIndex: 1,
  },
}));

const formSchema = z.object({
  'Slack Name': z.string().min(1),
  'Slack Email Address': z.string().min(1),
  'Hosted link': z.string().min(1),
});
type FormSchema = z.infer<typeof formSchema>;

const userSchema = z.object({
  username: z.string().min(1),
  hostedLink: z.string().min(1),
  email: z.string().min(1),
});
type UserSchema = z.infer<typeof userSchema>;

const usersSchema = z.object({
  users: z.array(userSchema).min(1, { message: 'Please add at least 1 user' }),
});
type UsersSchema = z.infer<typeof usersSchema>;

const Page = () => {
  const { classes } = useStyles();
  const stage = api.stage2.stageUpload.useMutation();
  const stageTests = api.stage2.stage.useMutation();

  const [manualAddOpen, manualAddHandlers] = useDisclosure(false, {
    onClose: () => {
      manualAddForm.reset();
    },
  });

  const form = useForm<UsersSchema>({
    initialValues: {
      users: [],
    },
    validate: zodResolver(usersSchema),
  });

  const manualAddForm = useForm({
    initialValues: {
      username: '',
      hostedLink: '',
      email: '',
    },
    validate: zodResolver(userSchema),
  });

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

  const addUser = (user: UserSchema) => {
    if (form.values.users.find(u => u.username === user.username)) return;
    if (form.values.users.find(u => u.email === user.email)) return;
    form.insertListItem('users', user);
  };
  const removeUser = (email: UserSchema['email']) => {
    const users = form.values.users.filter(user => user.email !== email);
    form.setFieldValue('users', users);
  };

  return (
    <>
      <Title>Stage 2 tests - Upload all</Title>

      {form.errors.users && <CustomError message={form.errors.users} />}
      {stage.isError && <CustomError message={stage.error.message} />}

      <CustomDropzone
        onDrop={files => {
          const reader = new FileReader();
          const users: UsersSchema['users'] = [];

          reader.onload = e => {
            const csv = e?.target?.result;
            if (typeof csv === 'string') {
              const results = parseCsv<keyof FormSchema>({
                data: csv,
                headerExists: true,
              });
              results.forEach(result => {
                if (result !== null && Object.keys(result).length > 0) {
                  const parsed = formSchema.safeParse(result);
                  if (parsed.success) {
                    users.push({
                      username: parsed.data['Slack Name'],
                      hostedLink: parsed.data['Hosted link'],
                      email: parsed.data['Slack Email Address'],
                    });
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

      <Group position="right" mb="lg">
        <Button onClick={manualAddHandlers.open}>Manual Add</Button>
      </Group>

      {manualAddOpen && (
        <Modal
          onClose={manualAddHandlers.close}
          opened={manualAddOpen}
          title="Manual Add"
        >
          <form
            onSubmit={manualAddForm.onSubmit(values => {
              addUser(values);
              manualAddHandlers.close();
            })}
          >
            <Stack>
              <TextInput
                withAsterisk
                classNames={classes}
                label="Username"
                placeholder="Enter the username"
                {...manualAddForm.getInputProps('username')}
              />
              <TextInput
                withAsterisk
                classNames={classes}
                label="Hosted Link"
                placeholder="Enter the hosted link"
                {...manualAddForm.getInputProps('hostedLink')}
              />
              <TextInput
                withAsterisk
                classNames={classes}
                label="Email"
                placeholder="Enter the email"
                {...manualAddForm.getInputProps('email')}
              />

              <Group position="right" mt="lg">
                <Button onClick={manualAddHandlers.close} color="red">
                  Cancel
                </Button>
                <Button type="submit" color="green">
                  Add
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      )}

      {form.values.users.length > 0 && (
        <>
          <Group position="right" mb="xl">
            {(['passed', 'pending', 'failed'] as const).map(type => {
              return (
                <Button
                  key={type}
                  disabled={
                    stageTests.data == undefined ||
                    stageTests.data[type].length === 0
                  }
                  color="green"
                  onClick={() => {
                    if (stageTests.data == undefined) return;
                    handleDownload(stageTests.data[type], type);
                  }}
                >
                  Download {type}
                </Button>
              );
            })}

            <Button
              color="green"
              onClick={() => stageTests.mutate(form.values)}
              loading={stageTests.isLoading}
            >
              Run Tests
            </Button>

            <Button
              color="yellow"
              onClick={() => {
                form.setFieldValue('users', []);
              }}
            >
              Clear all
            </Button>

            <Button
              onClick={() => {
                stage.mutate(form.values);
              }}
              loading={stage.isLoading}
            >
              Upload Members {`(${form.values.users?.length})`}
            </Button>
          </Group>
          <CustomTable
            headers={['username', 'hostedLink', 'email']}
            data={form.values.users}
            showActionsRow
          >
            {users => {
              return users.map(user => (
                <tr key={user.email}>
                  <td>{user.username}</td>
                  <td>{user.hostedLink}</td>
                  <td>{user.email}</td>
                  <td>
                    <Group position="right">
                      <ActionIcon
                        color="red"
                        onClick={() => removeUser(user.email)}
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
