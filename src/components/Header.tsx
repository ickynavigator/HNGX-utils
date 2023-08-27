import {
  Burger,
  Header,
  MediaQuery,
  Text,
  useMantineTheme,
} from '@mantine/core';

interface ICustomHeaderProps {
  opened: boolean;
  setOpened: (opened: boolean | ((opened: boolean) => boolean)) => void;
}
const CustomHeader = (props: ICustomHeaderProps) => {
  const theme = useMantineTheme();
  const { opened, setOpened } = props;

  return (
    <Header height={{ base: 50, md: 70 }} p="md">
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened(o => !o)}
            size="sm"
            color={theme.colors.gray[6]}
            mr="xl"
          />
        </MediaQuery>

        <Text>Application header</Text>
      </div>
    </Header>
  );
};

export default CustomHeader;
