import {
  Button,
  Container,
  Group,
  Select,
  Stack,
  TextInput,
  Textarea,
  createStyles,
  rem,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import CustomError from '~/components/Error';
import CustomSuccess from '~/components/Success';
import { api } from '~/utils/api';

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

const Page = () => {
  const DELIMITER = ',';

  const repoFetch = api.repoTools.repoFetch.useMutation();
  const addUsers = api.repoTools.addUsers.useMutation();

  const { classes } = useStyles();
  const form = useForm({
    initialValues: {
      token: '',
    },
  });
  const updateForm = useForm({
    initialValues: {
      selectedRepo: '',
      users: '',
    },
    validate: {
      selectedRepo: value => value.length > 0,
      users: value => {
        const users = value.split(DELIMITER).map(user => user.trim());
        return users.length > 0 && users.every(user => user.length > 0);
      },
    },
  });

  return (
    <Container py="xl">
      <Stack>
        <form onSubmit={form.onSubmit(values => repoFetch.mutate(values))}>
          <Stack>
            {repoFetch.isError && <CustomError />}

            <TextInput
              withAsterisk
              classNames={classes}
              label="Token"
              placeholder="Github Token"
              {...form.getInputProps('token')}
            />
            <Group position="right">
              <Button type="submit" loading={repoFetch.isLoading}>
                Submit
              </Button>
            </Group>
          </Stack>
        </form>

        {repoFetch.data != undefined && (
          <form
            onSubmit={updateForm.onSubmit(values => {
              const users = values.users
                .split(DELIMITER)
                .map(user => user.trim());

              addUsers.mutate({
                selectedRepo: values.selectedRepo,
                token: form.values.token,
                users,
              });
            })}
          >
            <Stack>
              <Select
                withAsterisk
                classNames={classes}
                label="Repository to update"
                placeholder="Pick one"
                data={repoFetch.data}
                {...updateForm.getInputProps('selectedRepo')}
              />
              <Textarea
                withAsterisk
                autosize
                minRows={2}
                maxRows={4}
                label="Emails/Usernames"
                placeholder="Enter Users"
                description={`Enter a list of emails or usernames separated by a '${DELIMITER}'`}
                {...updateForm.getInputProps('users')}
              />
              <Group position="right">
                <Button type="submit" loading={addUsers.isLoading}>
                  Add Users
                </Button>
              </Group>

              {addUsers.isError && (
                <CustomError message="Something went wrong!" />
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
