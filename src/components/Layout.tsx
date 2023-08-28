import { AppShell, createStyles } from '@mantine/core';
import { useState } from 'react';
import CustomHeader from '~/components/Header';
import CustomNavbar from '~/components/Navbar';

const useStyles = createStyles(theme => ({
  main: {
    background:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[8]
        : theme.colors.gray[0],
  },
}));

interface ILayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: ILayoutProps) => {
  const [opened, setOpened] = useState(false);

  const { classes } = useStyles();

  return (
    <AppShell
      classNames={{
        main: classes.main,
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        <CustomNavbar
          p="md"
          hiddenBreakpoint="sm"
          hidden={!opened}
          width={{ sm: 300 }}
        />
      }
      header={<CustomHeader opened={opened} setOpened={setOpened} />}
    >
      {children}
    </AppShell>
  );
};

export default Layout;
