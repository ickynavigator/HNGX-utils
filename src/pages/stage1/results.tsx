import { Center, Container, Loader } from '@mantine/core';
import CustomError from '~/components/Error';
import CustomTable from '~/components/Table';
import { api } from '~/utils/api';

const results = () => {
  const stage1 = api.stages.stage1Get.useQuery();

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

  return (
    <Container>
      <CustomTable
        headers={['username', 'hostedLink', 'email', 'grade']}
        data={stage1.data}
      >
        {users => {
          return users.map(user => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.hostedLink}</td>
              <td>{user.email}</td>
              <td>{user.grade}</td>
            </tr>
          ));
        }}
      </CustomTable>
    </Container>
  );
};

export default results;
