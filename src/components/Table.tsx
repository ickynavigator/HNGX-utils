import {
  Center,
  Group,
  ScrollArea,
  Table,
  Text,
  TextInput,
  UnstyledButton,
  createStyles,
  rem,
} from '@mantine/core';
import { keys } from '@mantine/utils';
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';

const useStyles = createStyles(theme => ({
  th: {
    padding: '0 !important',
  },

  control: {
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  icon: {
    width: rem(21),
    height: rem(21),
    borderRadius: rem(21),
  },
}));

type Row = {
  [key in string]: string | number;
};

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

const Th = ({ children, reversed, sorted, onSort }: ThProps) => {
  const { classes } = useStyles();
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group position="apart" miw="9rem">
          <Text fw={500} fz="sm" tt="capitalize">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size="0.9rem" stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
};

const filterData = <Data extends Row>(data: Data[], search: string) => {
  const query = search.toLowerCase().trim();
  return data.filter(item =>
    keys(data[0]).some(key => String(item[key])?.toLowerCase().includes(query)),
  );
};

const sortData = <Data extends Row>(
  data: Data[],
  payload: { sortBy: keyof Data | null; reversed: boolean; search: string },
) => {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      const aItem = a[sortBy];
      const bItem = b[sortBy];

      if (typeof aItem === 'number' && typeof bItem === 'number') {
        return payload.reversed ? bItem - aItem : aItem - bItem;
      }

      if (typeof aItem === 'string' && typeof bItem === 'string') {
        return payload.reversed
          ? String(bItem).localeCompare(String(aItem))
          : String(aItem).localeCompare(String(bItem));
      }

      return 0;
    }),
    payload.search,
  );
};

interface TableSortProps<Data extends Row> {
  data: Data[];
  headers: (keyof Data)[];
  children(sortedData: Data[]): React.ReactNode;
  showActionsRow?: boolean;
}

const CustomTable = <Data extends Row>({
  data,
  headers,
  children,
  showActionsRow = false,
}: TableSortProps<Data>) => {
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof Data | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  useEffect(() => {
    setSortedData(
      sortData(data, { sortBy, reversed: reverseSortDirection, search }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const setSorting = (field: keyof Data) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(
      sortData(data, { sortBy, reversed: reverseSortDirection, search: value }),
    );
  };

  return (
    <ScrollArea>
      <TextInput
        placeholder="Search by any field"
        mb="md"
        icon={<IconSearch size="0.9rem" stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      />
      <Table>
        <thead>
          <tr>
            {headers.map(header => (
              <Th
                key={String(header)}
                sorted={sortBy === header}
                reversed={reverseSortDirection}
                onSort={() => setSorting(header)}
              >
                {String(header)}
              </Th>
            ))}
            {showActionsRow && <th />}
          </tr>
        </thead>
        <tbody>{children(sortedData)}</tbody>
      </Table>
    </ScrollArea>
  );
};

export default CustomTable;
