import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { z } from 'zod';
import CustomDropzone from '~/components/Dropzone';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';
import { parseCsv } from '~/utils/csvHelpers';
import { differ } from '~/utils/tools';

const userSchema = z.object({
  username: z.string().min(1),
  email: z.string().min(1),
  // status: z.string().min(1),
  // 'has-2fa': z.string(),
  // userid: z.string().min(1),
  // fullname: z.string().min(1),
  // displayname: z.string().min(1).optional(),
  // timezone: z.string().min(1),
});
type UserSchema = z.infer<typeof userSchema>;

const usersSchema = z.array(userSchema).min(1);
const formSchema = z.object({
  general: usersSchema,
  nextStage: usersSchema,
});
type FormSchema = z.infer<typeof formSchema>;

const types = ['general', 'nextStage'] as const;

const Page = () => {
  const [results, setResults] = useState('');
  const diff = api.tools.diff.useMutation({
    onSuccess: data => {
      setResults(data.diffed);
    },
  });
  const [showTable, setShowTable] = useState(false);
  const [runLocal, setRunLocal] = useState(true);

  const form = useForm<FormSchema>({
    initialValues: {
      general: [],
      nextStage: [],
    },
    validate: zodResolver(formSchema),
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

  const addUser = (user: UserSchema, type: keyof FormSchema) => {
    if (form.values[type].find(u => u.email === user.email)) return;

    form.insertListItem(type, user);
  };

  const removeUser = (email: UserSchema['email'], type: keyof FormSchema) => {
    const users = form.values[type].filter(u => u.email !== email);

    form.setFieldValue(type, users);
  };

  const localRunner = () => {
    const diffed = differ(form.values.general, form.values.nextStage);
    setResults(diffed);
  };

  return (
    <>
      <Title>Diff Exports</Title>

      {form.errors.users && <CustomError message={form.errors.users} />}
      {diff.isError && <CustomError message={diff.error.message} />}

      <Group grow>
        {types.map(type => (
          <Stack key={type}>
            <Title tt="capitalize">{type}</Title>
            <CustomDropzone
              max={1}
              key={type}
              onDrop={files => {
                const reader = new FileReader();
                const users: FormSchema[typeof type] = [];

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
                          users.push(parsed.data);
                        }
                      }
                    });
                  }

                  users.forEach(user => addUser(user, type));
                };

                files.forEach(file => reader.readAsText(file));
              }}
            >
              <Text size="xl" inline>
                Drag CSV file here (or click here to select)
              </Text>
              <Text size="sm" color="dimmed" inline mt={7}>
                Please only add one file at a time. The file should not exceed
                5mb.
              </Text>
            </CustomDropzone>
          </Stack>
        ))}
      </Group>

      <Group mb="xl">
        <Checkbox
          mt="md"
          label="Show the tables"
          checked={showTable}
          onChange={event => setShowTable(event.currentTarget.checked)}
        />
        <Checkbox
          mt="md"
          label="Run on device (if the list is too large)"
          checked={runLocal}
          onChange={event => setRunLocal(event.currentTarget.checked)}
        />
      </Group>

      {form.values.general.length > 0 && (
        <>
          <Group position="right" mb="xl" grow>
            <Button
              disabled={results.length === 0}
              color="green"
              onClick={() => {
                handleDownload(results, 'diffed');
              }}
            >
              Download diffed
            </Button>

            <Button
              color="green"
              onClick={() => {
                if (runLocal) {
                  localRunner();
                } else {
                  diff.mutate({
                    general: form.values.general,
                    nextStage: form.values.nextStage,
                  });
                }
              }}
              loading={diff.isLoading}
            >
              Run Diff
            </Button>

            <Button
              color="yellow"
              onClick={() => {
                form.reset();
              }}
            >
              Clear all
            </Button>
          </Group>

          {showTable ? (
            <Group grow align="start">
              {types.map(type => (
                <CustomTable
                  key={type}
                  headers={['username', 'email']}
                  data={form.values[type]}
                  showActionsRow
                >
                  {users => {
                    return users.map(user => (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <Group position="right">
                            <ActionIcon
                              color="red"
                              onClick={() => removeUser(user.email, type)}
                            >
                              <IconTrash />
                            </ActionIcon>
                          </Group>
                        </td>
                      </tr>
                    ));
                  }}
                </CustomTable>
              ))}
            </Group>
          ) : null}
        </>
      )}
    </>
  );
};

export default Page;
