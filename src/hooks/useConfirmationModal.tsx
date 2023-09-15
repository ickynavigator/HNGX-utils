import { Group, Text, Title } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { IconExclamationCircle } from '@tabler/icons-react';

export const useConfirmationModal = (action: () => void) => {
  const modals = useModals();

  return () => {
    modals.openConfirmModal({
      children: <Text>Are you sure you want to perform this action?</Text>,
      onConfirm: action,
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      title: (
        <Group>
          <IconExclamationCircle color="red" size={'2rem'} />
          <Title order={3}>Confirm Action</Title>
        </Group>
      ),
    });
  };
};
