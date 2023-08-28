import {
  Anchor,
  Button,
  Code,
  Container,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import CustomError from '~/components/Error';
import CustomSuccess from '~/components/Success';
import { api } from '~/utils/api';

const Permissions = ['pull', 'triage', 'push', 'maintain', 'admin'];

const Page = () => {
  const DELIMITER = ',';

  const repoFetch = api.repoTools.repoFetch.useMutation();
  const addUsers = api.repoTools.addUsers.useMutation();
  const form = useForm({
    initialValues: {
      token: '',
    },
  });
  const updateForm = useForm({
    initialValues: {
      selectedRepo: '',
      users: '',
      permission: 'pull',
    },
    validate: {
      selectedRepo: value =>
        value.length > 0 ? false : 'Please select a repository',
      users: value => {
        const users = value.split(DELIMITER).map(user => user.trim());
        const invalidUsers = users.filter(user => user.length === 0);

        return invalidUsers.length > 0
          ? 'Please enter a valid list of users'
          : false;
      },
    },
  });

  return (
    <Container py="xl">
      <Title>Github Repo Collab tool</Title>
      <Text c="dimmed">
        Github limits you to 50 invitations for every 24 hour period -{' '}
        <Anchor href="https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#add-a-repository-collaborator">
          src
        </Anchor>
      </Text>
      <Stack>
        <form onSubmit={form.onSubmit(values => repoFetch.mutate(values))}>
          <Stack>
            <TextInput
              withAsterisk
              label="Token"
              placeholder="Github Token"
              description={
                <Text>
                  Token should have <Code color="grape">read:user, repo</Code>
                </Text>
              }
              {...form.getInputProps('token')}
            />
            <Group position="right">
              <Button type="submit" loading={repoFetch.isLoading}>
                Submit
              </Button>
            </Group>
            {repoFetch.isError && (
              <CustomError message={repoFetch.error.message} />
            )}
          </Stack>
        </form>

        {repoFetch.data != undefined && (
          <form
            onSubmit={updateForm.onSubmit(values => {
              const { users, ...others } = values;
              const mappedUsers = users
                .split(DELIMITER)
                .map(user => user.trim());

              addUsers.mutate({
                token: form.values.token,
                users: mappedUsers,
                ...others,
              });
            })}
          >
            <Stack>
              <Select
                withAsterisk
                label="Repository to update"
                placeholder="Pick one"
                data={repoFetch.data}
                {...updateForm.getInputProps('selectedRepo')}
              />
              <Select
                withAsterisk
                label="Set Permission"
                placeholder="Pick one"
                data={Permissions}
                {...updateForm.getInputProps('permission')}
              />
              <Textarea
                withAsterisk
                autosize
                minRows={2}
                maxRows={4}
                label="Usernames"
                placeholder="Enter Users"
                description={
                  <Text>
                    Enter a list of usernames separated by a{' '}
                    <Code color="grape">{DELIMITER}</Code>
                  </Text>
                }
                {...updateForm.getInputProps('users')}
              />
              <Group position="right">
                <Button type="submit" loading={addUsers.isLoading}>
                  Add Users
                </Button>
              </Group>

              {addUsers.isError && (
                <CustomError message={addUsers.error.message} />
              )}
              {addUsers.isSuccess && (
                <CustomSuccess message="Users added successfully!" />
              )}
            </Stack>
          </form>
        )}
      </Stack>
    </Container>
  );
};

export default Page;
