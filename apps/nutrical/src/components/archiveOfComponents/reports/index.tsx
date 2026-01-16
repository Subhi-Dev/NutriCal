import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { FetchAndCache } from '~/components/FetchAndCache'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuItemIcon
} from '~/components/reports/Dropdown'
import LoadingIndicator from '~/components/reports/LoadingIndicator'
import Report from '~/components/reports/Report'

export default function Reports() {
  // Initialization
  const [loading, toggleLoading] = useState(true)
  async function getValueFor(key: string) {
    return await SecureStore.getItemAsync(key)
  }

  const [date, setDate] = useState(new Date())
  const [bodyDistributionData, setBodyDistributionData] = useState([
    {
      name: 'Minerals',
      percent: 2.4,
      color: '#222',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    },
    {
      name: 'Fats',
      percent: 11.51,
      color: '#333333',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    },
    {
      name: 'Proteins',
      percent: 15.62,
      color: '#666',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    },
    {
      name: 'Fluids',
      percent: 38.98,
      color: '#999',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    }
  ])
  const [reportData, setReportData] = useState([])
  const [currentReportIndex, setCurrentReportIndex] = useState(0)
  const [BMI, setBMI] = useState(0)
  const [BMR, setBMR] = useState(0)
  let parsedData = { value: reportData }
  const [userData, setUserData] = useState({ ID: 0 })
  function updateBodyDistributionData(reportIndex) {
    setBodyDistributionData([
      {
        name: 'Fluids',
        percent: Math.round(parsedData['value'][reportIndex].TBWK * 100) / 100,
        color: '#06C',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15
      },
      {
        name: 'Protein',
        percent: Math.round(parsedData['value'][reportIndex].ProK * 100) / 100,
        color: '#4CB140',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15
      },
      {
        name: 'Lipids',
        percent: Math.round(parsedData['value'][reportIndex].FATK * 100) / 100,
        color: '#F4C145',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15
      },
      {
        name: 'Minerals',
        percent: Math.round(parsedData['value'][reportIndex].MineK * 100) / 100,
        color: '#EC7A08',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15
      }
    ])
  }
  useEffect(() => {
    if (parsedData['value'][currentReportIndex]) {
      updateBodyDistributionData(currentReportIndex)
      setBMI(Math.round(reportData[currentReportIndex]['BMI'] * 100) / 100)
      setBMR(Math.round(reportData[currentReportIndex]['BMR'] * 10) / 10)
    }
  }, [currentReportIndex])
  useEffect(() => {
    requestReport()
  }, [])
  const requestReport = async () => {
    const userData = JSON.parse(await getValueFor('userData'))
    setUserData(userData)
    if (userData) {
      try {
        const currentMonth =
          dayjs(date).subtract(2, 'month').format('YYYY-MM-DDThh:mm:ss') + 'Z'
        console.log(currentMonth)
        const response = await FetchAndCache(
          'getReports',
          '/api/Report?$first=7&$orderby=ID desc&$filter=RecordDay ge ' +
            currentMonth +
            ' and Cust_ID eq ' +
            userData['ID'],
          'GET'
        )
        const data = await response.data
        toggleLoading(false)
        if (data['value']) {
          parsedData = data
          setReportData(parsedData['value'])
          if (currentReportIndex === 0) {
            if (parsedData?.value[0]) {
              setBMI(Math.round(parsedData['value'][0]['BMI'] * 100) / 100)
              setBMR(Math.round(parsedData['value'][0]['BMR'] * 10) / 10)
              updateBodyDistributionData(0)
              updateBodyDistributionData(0)
            }
          }
          setCurrentReportIndex(0)
        }
      } catch (err) {
        console.log('Report Page Error: ' + err)
        captureException(err)
      }
    } else {
      Toast.show({ type: 'error', text1: 'Please Log in again' })
    }
  }

  //TODO: Weight Graph
  return (
    <SafeAreaView className={'h-screen'}>
      <ScrollView className={''}>
        <View
          className={
            'mx-4 flex flex-row justify-between items-center mt-2 py-2'
          }
        >
          <Text className={'font-display-bold text-2xl mb-2'}>Reports</Text>

            <DropdownMenuRoot>
              <DropdownMenuTrigger>
                <View
                  className={
                    'flex flex-row justify-center items-center rounded-full bg-green-600 p-1 mb-2'
                  }
                >
                  <MaterialIcons
                    name={'add'}
                    size={24}
                    color={'#FFF'}
                  />
                </View>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  key={'ble'}
                  onSelect={() => {
                    router.navigate('/nutrical/reports/scale')
                  }}
                >
                  <DropdownMenuItemTitle>Bluetooth scale</DropdownMenuItemTitle>
                  <DropdownMenuItemIcon
                    ios={{
                      name: 'radiowaves.right'
                    }}
                    androidIconName={'stat_sys_data_bluetooth'}
                  ></DropdownMenuItemIcon>
                </DropdownMenuItem>
                <DropdownMenuItem
                  key={'manual'}
                  onSelect={() => {
                    router.navigate('/nutrical/reports/manualAddition')
                  }}
                >
                  <DropdownMenuItemTitle>
                    Auto Calculation
                  </DropdownMenuItemTitle>
                  <DropdownMenuItemIcon
                    ios={{
                      name: 'square.and.pencil'
                    }}
                    androidIconName={'stat_sys_data_bluetooth'}
                  ></DropdownMenuItemIcon>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuRoot>
        </View>
        {loading ? (
          <LoadingIndicator />
        ) : reportData.toString() === '' ? (
          <View
            className={
              'mx-4 mb-10 rounded-3xl bg-white shadow-2xl flex flex-row items-center justify-center p-8'
            }
          >
            <Text className={'font-display text-center text-lg'}>
              No reports availible
            </Text>
          </View>
        ) : (
          <View>
            <View
              className={
                'flex flex-row justify-between items-center bg-white mx-4 rounded-lg shadow  p-4'
              }
            >
              <Text className={'font-display text-xl'}>Report date</Text>
              <DropdownMenuRoot>
                <DropdownMenuTrigger>
                  <View className={'bg-gray-200 p-2 rounded-lg'}>
                    <Text className={'text-md'}>
                      {dayjs(reportData[currentReportIndex].RecordDay).format(
                        'dddd DD/MM/YYYY'
                      )}
                    </Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Date</DropdownMenuLabel>
                  {reportData.map((report, index) => (
                    <DropdownMenuItem
                      key={index}
                      onSelect={() => {
                        setCurrentReportIndex(index)
                      }}
                    >
                      <DropdownMenuItemTitle>
                        {dayjs(report.RecordDay).format('dddd DD/MM/YYYY')}
                      </DropdownMenuItemTitle>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenuRoot>
            </View>
            <Report
              reportData={reportData}
              bodyDistributionData={bodyDistributionData}
              BMI={BMI}
              BMR={BMR}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
/*
                <View className={"relative bg-emerald-500 flex flex-col justify-around w-screen items-center justify-center"}>
                    <Text className={"z-10 text-white font-display text-xl w-24 absolute text-center"}>Left <Text className={"text-2xl"}>1672</Text> kcal</Text>
                    <ProgressChart
                        data={data}
                        width={220}
                        height={220}
                        strokeWidth={6}
                        radius={28}
                        chartConfig={{
                            backgroundColor: "#10b981",
                            backgroundGradientFrom: "#10b981",
                            backgroundGradientTo: "#10b981",
                            decimalPlaces: 2, // optional, defaults to 2dp
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        }}
                        hideLegend={true}
                        className={""}
                    />
                </View>

<View className={" rounded-full bg-teal-300"}>
                    <MaterialIcons name={"add"} size={32} color={"#0f766e"}/>
                </View>

        <View className={"flex flex-row justify-between items-center bg-white mx-4 rounded-lg shadow mt-2 p-4"}>
              <Text className={"font-display text-xl"}>Report Date</Text>
              {Platform.OS === "ios" &&(

                  <DateTimePicker
                      testID="dateTimePicker"
                      value={date}
                      mode={"date"}
                      onChange={onChange}
                  />
                  )
              }
              {Platform.OS === "android" &&(
                  <Pressable onPress={showDatepicker} className={"bg-gray-200 p-2 rounded-lg"}>
                      <Text className={"font-display text-lg"}>{date.toLocaleDateString()}</Text>
                  </Pressable>

              )}
          </View>

        //////////V2 Date Picker
            LocaleConfig.locales['ar'] = {

    LocaleConfig.defaultLocale = 'ar';

    ///////JSX
    <CalendarProvider date={"2024-05-15"}>
                  <ExpandableCalendar
                      initialDate={"2024-05-15"}
                      initialPosition={"closed"}
                      disablePan={true}
                      hideKnob={true}
                      allowSelectionOutOfRange={false}
                      pastScrollRange={3}
                      futureScrollRange={0}
                      disabledByDefault={true}
                      disableAllTouchEventsForDisabledDays={true}
                      disableAllTouchEventsForInactiveDays={true}
                      markedDates={{
                          '2024-05-16': {marked: true, disableTouchEvent: false, disabled: false},
                          '2024-05-17': {marked: true, disableTouchEvent: false, disabled: false},
                          '2024-05-18': {marked: true, disableTouchEvent: false, disabled: false},
                          '2024-05-19': {marked: true, disableTouchEvent: false, disabled: false}
                      }}
                  />
              </CalendarProvider>



    ////////V1 Date Picker
      //Android Report Date Picker
  const showMode = (currentMode) => {
      DateTimePickerAndroid.open({
          value: date,
          onChange,
          mode: currentMode,
          is24Hour: true,
      });
  };

  const showDatepicker = () => {
      showMode('date');
  };

  //iOS report Date picker
  const onChange = (event, selectedDate) => {
      setDate(selectedDate);
  };

    */
