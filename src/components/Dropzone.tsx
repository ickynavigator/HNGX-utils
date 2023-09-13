import { Group, rem, useMantineTheme } from '@mantine/core';
import {
  Dropzone,
  type FileRejection,
  type FileWithPath,
} from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';

interface ICustomDropzoneProps {
  type?: string[];
  size?: number;
  max?: number;

  children: React.ReactNode;
  onDrop: (files: FileWithPath[]) => void;
  onReject?: (files: FileRejection[]) => void;
}

const CustomDropzone = (props: ICustomDropzoneProps) => {
  const {
    type,
    max = 1,
    size = 3 * 1024 ** 2,
    children,
    onDrop,
    onReject,
    ...others
  } = props;
  const theme = useMantineTheme();

  return (
    <Dropzone
      onDrop={onDrop}
      onReject={onReject}
      maxSize={size}
      maxFiles={max}
      accept={type}
      my="lg"
      {...others}
    >
      <Group
        position="center"
        spacing="xl"
        style={{ minHeight: rem(220), pointerEvents: 'none' }}
      >
        <Dropzone.Accept>
          <IconUpload
            size="3.2rem"
            stroke={1.5}
            color={
              theme.colors[theme.primaryColor]?.[
                theme.colorScheme === 'dark' ? 4 : 6
              ]
            }
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size="3.2rem"
            stroke={1.5}
            color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconUpload size="3.2rem" stroke={1.5} />
        </Dropzone.Idle>

        <div>{children}</div>
      </Group>
    </Dropzone>
  );
};

export default CustomDropzone;
