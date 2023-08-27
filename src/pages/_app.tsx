import { MantineProvider } from '@mantine/core';
import { type AppType } from 'next/app';
import Head from 'next/head';
import { RouterTransition } from '~/components/RouterTransition';
import '~/styles/globals.css';
import { api } from '~/utils/api';

const MyApp: AppType = props => {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <title>Page title</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'light',
        }}
      >
        <RouterTransition />
        <Component {...pageProps} />
      </MantineProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
