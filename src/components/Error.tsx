import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ICustomErrorProps {
  message?: string;
}
const CustomError = (props: ICustomErrorProps) => {
  const { message = 'Something terrible happened!' } = props;

  return (
    <Alert icon={<IconAlertCircle size="1rem" />} title="Bummer!" color="red">
      {message}
    </Alert>
  );
};

export default CustomError;
