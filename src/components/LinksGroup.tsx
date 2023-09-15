import {
  Box,
  Collapse,
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
  createStyles,
  getStylesRef,
  rem,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

const useStyles = createStyles(theme => ({
  control: {
    fontWeight: 500,
    display: 'block',
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    fontSize: theme.fontSizes.sm,

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    },
  },

  link: {
    fontWeight: 500,
    display: 'block',
    textDecoration: 'none',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    paddingLeft: rem(31),
    marginLeft: rem(30),
    fontSize: theme.fontSizes.sm,
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    borderLeft: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    },
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

  chevron: {
    transition: 'transform 200ms ease',
  },
}));

export interface LinksGroupProps {
  icon: React.FC<{ size?: string }>;
  label: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
}

export const LinksGroup = ({
  icon: Icon,
  label,
  initiallyOpened,
  links,
}: LinksGroupProps) => {
  const { classes, theme, cx } = useStyles();
  const [opened, setOpened] = useState(initiallyOpened ?? false);
  const [active, setActive] = useState('');
  useEffect(() => {
    if (typeof window == undefined) return;

    const currPath = window.location.pathname.slice(1).toLowerCase();
    setActive(currPath);
    if (links?.some(link => link.link === currPath)) {
      setOpened(true);
    }
  }, [links]);

  const hasLinks = Array.isArray(links);
  const ChevronIcon = theme.dir === 'ltr' ? IconChevronRight : IconChevronLeft;
  const items = (hasLinks ? links : []).map(link => (
    <Text<'a'>
      component="a"
      className={cx(classes.link, {
        [classes.linkActive]: link.link === active,
      })}
      href={`/${link.link}`}
      key={link.label}
    >
      {link.label}
    </Text>
  ));

  return (
    <>
      <UnstyledButton
        onClick={() => setOpened(o => !o)}
        className={classes.control}
      >
        <Group position="apart" spacing={0}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size="1.1rem" />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <ChevronIcon
              className={classes.chevron}
              size="1rem"
              stroke={1.5}
              style={{
                transform: opened
                  ? `rotate(${theme.dir === 'rtl' ? -90 : 90}deg)`
                  : 'none',
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks && opened ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
};
