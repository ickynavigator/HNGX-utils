import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Tabs,
  Text,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import { z } from 'zod';
import CustomDropzone from '~/components/Dropzone';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { useConfirmationModal } from '~/hooks/useConfirmationModal';
import { api } from '~/utils/api';
import { parseCsv } from '~/utils/csvHelpers';

const TabTypes = {
  Submission: 'submissions',
  Sorted: 'sorted',
  Uploads: 'uploads',
  NoMention: 'no mentions',
} as const;

const correctString = z
  .string()
  .min(1)
  .transform(data => {
    if (data.match(/@/)) return data.replaceAll(/@/g, '').trim();
    return data.trim();
  });
const formSchema = z.object({
  'Your Slack Name': correctString,
  'First Saving Grace Slack Name': correctString,
  'Second Saving Grace Slack Name': correctString,
  'Third Saving Grace Slack Name': correctString,
});
type FormSchema = z.infer<typeof formSchema>;

const userSchema = z.object({
  username: z.string(),
  friends: z.array(z.string()),
});
type UserSchema = z.infer<typeof userSchema>;

const usersSchema = z.object({
  users: z.array(userSchema).min(1, { message: 'Please add at least 1 user' }),
});
type UsersSchema = z.infer<typeof usersSchema>;

const Page = () => {
  const utils = api.useContext();

  const upload = api.grace3.uploadSavingGrace.useMutation({
    onSuccess: async () => {
      await utils.grace3.getSavingGraceSubmissions.invalidate();
      await utils.grace3.getSavingGraceSorted.invalidate();
    },
  });
  const sorted = api.grace3.getSavingGraceSorted.useQuery();
  const noMention = api.grace3.getNoMentions.useQuery();
  const submission = api.grace3.getSavingGraceSubmissions.useQuery();
  const sortSubmissions = api.grace3.runSavingGraceSorted.useMutation({
    onSuccess: async () => {
      await utils.grace3.getSavingGraceSorted.invalidate();
      await utils.grace3.getNoMentions.invalidate();
    },
  });
  const deleteAll = api.grace3.deleteSavingGraceSubmissions.useMutation({
    onSuccess: async () => {
      await utils.grace3.getSavingGraceSubmissions.invalidate();
    },
  });
  const deleteNoMentions = api.grace3.deleteSavingGraceSubmissions.useMutation({
    onSuccess: async () => {
      await utils.grace3.getNoMentions.invalidate();
    },
  });

  const form = useForm<UsersSchema>({
    initialValues: {
      users: [],
    },
    validate: zodResolver(usersSchema),
  });

  const confirmDelete = useConfirmationModal(() => {
    deleteAll.mutate();
  });
  const confirmDeleteNoMentions = useConfirmationModal(() => {
    deleteNoMentions.mutate();
  });

  const addUser = (user: UserSchema) => {
    form.insertListItem('users', user);
  };
  const removeUser = (username: UserSchema['username']) => {
    const users = form.values.users.filter(user => user.username !== username);
    form.setFieldValue('users', users);
  };

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

  const downloadNoMentions = () => {
    const data = `username\n${noMention.data
      ?.map(user => user.username)
      .join('\n')}`;

    handleDownload(data, 'no-mentions');
  };

  if (sorted.isLoading || noMention.isLoading || submission.isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }
  if (sorted.isError || noMention.isError || submission.isError) {
    return (
      <Center h="100%">
        <CustomError />
      </Center>
    );
  }

  return (
    <>
      <Tabs
        defaultValue={TabTypes.NoMention}
        keepMounted={false}
        variant="outline"
      >
        <Tabs.List mb="md">
          {Object.values(TabTypes).map((tab, index) => (
            <Tabs.Tab key={tab} value={tab} ml={index === 0 ? 'md' : 0}>
              <Text tt="capitalize">{tab}</Text>
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value={TabTypes.Submission}>
          {submission.data && (
            <>
              <Group mb="xl">
                <Button
                  onClick={confirmDelete}
                  loading={deleteAll.isLoading}
                  color="red"
                >
                  Delete All {`(${submission.data.length})`}
                </Button>
                <Button
                  onClick={() => sortSubmissions.mutate()}
                  loading={sortSubmissions.isLoading}
                >
                  Run sort
                </Button>
              </Group>
              <CustomTable
                headers={['username', 'friends']}
                data={submission.data.map(users => ({
                  username: users.username,
                  friends: users.friends.join(', '),
                }))}
              >
                {users => {
                  return users.map(user => (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>{user.friends}</td>
                    </tr>
                  ));
                }}
              </CustomTable>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value={TabTypes.Sorted}>
          {sorted.data && (
            <>
              <CustomTable headers={['username', 'count']} data={sorted.data}>
                {users => {
                  return users.map(user => (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>{user.count}</td>
                    </tr>
                  ));
                }}
              </CustomTable>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value={TabTypes.Uploads}>
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
                          username: parsed.data['Your Slack Name'],
                          friends: [
                            parsed.data['First Saving Grace Slack Name'],
                            parsed.data['Second Saving Grace Slack Name'],
                            parsed.data['Third Saving Grace Slack Name'],
                          ],
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
                headers={['username', 'friends']}
                data={form.values.users.map(users => ({
                  username: users.username,
                  friends: users.friends.join(', '),
                }))}
                showActionsRow
              >
                {users => {
                  return users.map(user => (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>{user.friends}</td>
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
        </Tabs.Panel>

        <Tabs.Panel value={TabTypes.NoMention}>
          {noMention.data && (
            <>
              <Group mb="xl">
                <Button
                  onClick={confirmDeleteNoMentions}
                  loading={deleteNoMentions.isLoading}
                  color="red"
                >
                  Delete All {`(${noMention.data.length})`}
                </Button>
                <Button onClick={downloadNoMentions}>Download CSV</Button>
              </Group>
              <CustomTable headers={['username']} data={noMention.data}>
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
        </Tabs.Panel>
      </Tabs>
    </>
  );
};

export default Page;
