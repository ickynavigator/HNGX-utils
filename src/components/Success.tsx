import { Alert } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

interface ICustomSuccessProps {
  message?: React.ReactNode;
}
const CustomSuccess = (props: ICustomSuccessProps) => {
  const { message = 'That action was successful!' } = props;

  return (
    <Alert icon={<IconCheck size="1rem" />} title="Success!" color="green">
      {message}
    </Alert>
  );
};

export default CustomSuccess;
