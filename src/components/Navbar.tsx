import {
  ActionIcon,
  Navbar,
  Text,
  createStyles,
  getStylesRef,
  rem,
  type ActionIconProps,
  type CSSObject,
  type NavbarProps,
} from '@mantine/core';
import {
  IconBoxMultiple1,
  IconBrandGithub,
  IconCircleNumber1,
  IconHexagonNumber1,
  IconRosetteNumber1,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

const useStyles = createStyles(theme => ({
  footer: {
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
  },

  link: {
    ...(theme.fn.focusStyles() as Record<string, CSSObject>),
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: theme.fontSizes.sm,
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[1]
        : theme.colors.gray[7],
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,

      [`& .${getStylesRef('icon')}`]: {
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
      },
    },
  },

  linkIcon: {
    ref: getStylesRef('icon'),
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[2]
        : theme.colors.gray[6],
    marginRight: theme.spacing.sm,
  },

  linkActive: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({
        variant: 'light',
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor })
        .color,
      [`& .${getStylesRef('icon')}`]: {
        color: theme.fn.variant({ variant: 'light', color: theme.primaryColor })
          .color,
      },
    },
  },
}));

const data = [
  {
    link: 'repoAddMembers',
    label: 'Add Github Members',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconBrandGithub stroke={2} />
      </ActionIcon>
    ),
  },
  {
    link: 'stage1/upload',
    label: 'Stage 1 Upload',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconCircleNumber1 stroke={2} />
      </ActionIcon>
    ),
  },
  {
    link: 'stage1/pending',
    label: 'Stage 1 Pending',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconBoxMultiple1 stroke={2} />
      </ActionIcon>
    ),
  },
  {
    link: 'stage1/results',
    label: 'Stage 1 Results',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconRosetteNumber1 stroke={2} />
      </ActionIcon>
    ),
  },
  {
    link: 'stage1/failed',
    label: 'Stage 1 Failed',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconHexagonNumber1 stroke={2} />
      </ActionIcon>
    ),
  },
];

const CustomNavbar = (props: Omit<NavbarProps, 'children'>) => {
  const { classes, cx } = useStyles();
  const [active, setActive] = useState('');

  useEffect(() => {
    if (typeof window == undefined) return;

    const currPath = window.location.pathname.slice(1).toLowerCase();
    setActive(currPath);
  }, []);

  const links = data.map(item => (
    <a
      className={cx(classes.link, {
        [classes.linkActive]: item.link.toLowerCase() === active,
      })}
      href={`/${item.link}`}
      key={item.label}
    >
      <item.icon className={classes.linkIcon} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <Navbar p="md" {...props}>
      <Navbar.Section grow>{links}</Navbar.Section>

      <Navbar.Section className={classes.footer}>
        <Text align="center">Built with ❤️</Text>
      </Navbar.Section>
    </Navbar>
  );
};

export default CustomNavbar;
