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
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import { z } from 'zod';
import CustomDropzone from '~/components/Dropzone';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api, type RouterInputs } from '~/utils/api';
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
type Users = RouterInputs['stage1']['stageUpload'];

const schema = z.object({
  username: z.string(),
  hostedLink: z.string(),
  email: z.string(),
});

const Page = () => {
  const { classes } = useStyles();
  const stage1 = api.stage1.stageUpload.useMutation();
  const stage1Tests = api.stage1.stage.useMutation();

  const [manualAddOpen, manualAddHandlers] = useDisclosure(false, {
    onClose: () => {
      manualAddForm.reset();
    },
  });

  const form = useForm<Users>({
    initialValues: {
      users: [],
    },
    validate: {
      users: value => {
        if (value.length === 0) return 'Please add at least 1 user';
        return true;
      },
    },
  });

  const manualAddForm = useForm({
    initialValues: {
      username: '',
      hostedLink: '',
      email: '',
    },
    validate: {
      username: value => {
        if (value.length === 0) return 'Username is required';
      },
      hostedLink: value => {
        if (value.length === 0) return 'Hosted link is required';
      },
      email: value => {
        if (value.length === 0) return 'Email is required';
      },
    },
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

  const addUser = (user: Users['users'][number]) => {
    if (form.values.users.find(u => u.username === user.username)) return;
    if (form.values.users.find(u => u.email === user.email)) return;
    form.insertListItem('users', user);
  };
  const removeUser = (username: Users['users'][number]['username']) => {
    form.setFieldValue(
      'users',
      form.values.users.filter(user => user.username !== username),
    );
  };

  return (
    <>
      <Title>Stage 1 tests - Upload all</Title>

      {form.errors.users && <CustomError message={form.errors.users} />}
      {stage1.isError && <CustomError message={stage1.error.message} />}

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
                  const parsed = schema.safeParse(result);
                  if (parsed.success) {
                    users.push(parsed.data);
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
                    stage1Tests.data == undefined ||
                    stage1Tests.data[type].length === 0
                  }
                  color="green"
                  onClick={() => {
                    if (stage1Tests.data == undefined) return;
                    handleDownload(stage1Tests.data[type], type);
                  }}
                >
                  Download {type}
                </Button>
              );
            })}

            <Button
              color="green"
              onClick={() => stage1Tests.mutate(form.values)}
              loading={stage1Tests.isLoading}
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
                stage1.mutate(form.values);
              }}
              loading={stage1.isLoading}
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
    </>
  );
};

export default Page;
