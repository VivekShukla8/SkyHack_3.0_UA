module.exports = {
  airports: {
    airport_iata_code: ['airport_iata_code', 'iata_code', 'airport_code', 'airport_iata'],
    iso_country_code: ['iso_country_code', 'country_code', 'iso_country', 'country']
  },
  flights: {
    company_id: ['company_id'],
    flight_number: ['flight_number', 'flt_no', 'flightno'],
    scheduled_departure_date_local: ['scheduled_departure_date_local', 'dep_date', 'departure_date'],
    scheduled_departure_station_code: ['scheduled_departure_station_code', 'dep_station', 'origin'],
    scheduled_arrival_station_code: ['scheduled_arrival_station_code', 'arr_station', 'destination'],
    scheduled_departure_datetime_local: ['scheduled_departure_datetime_local', 'dep_datetime_local', 'scheduled_dep_dt'],
    scheduled_arrival_datetime_local: ['scheduled_arrival_datetime_local', 'arr_datetime_local', 'scheduled_arr_dt'],
    actual_departure_datetime_local: ['actual_departure_datetime_local', 'actual_dep_dt'],
    actual_arrival_datetime_local: ['actual_arrival_datetime_local', 'actual_arr_dt'],
    total_seats: ['total_seats', 'seats_total'],
    fleet_type: ['fleet_type', 'aircraft_type'],
    carrier: ['carrier'],
    scheduled_ground_time_minutes: ['scheduled_ground_time_minutes', 'sched_ground_min'],
    actual_ground_time_minutes: ['actual_ground_time_minutes', 'actual_ground_min'],
    minimum_turn_minutes: ['minimum_turn_minutes', 'min_turn_minutes']
  },
  pnr: {
    company_id: ['company_id'],
    flight_number: ['flight_number'],
    scheduled_departure_date_local: ['scheduled_departure_date_local'],
    scheduled_departure_station_code: ['scheduled_departure_station_code'],
    scheduled_arrival_station_code: ['scheduled_arrival_station_code'],
    record_locator: ['record_locator', 'pnr_id', 'pnr'],
    pnr_creation_date: ['pnr_creation_date', 'created_date'],
    total_pax: ['total_pax', 'passenger_count'],
    lap_child_count: ['lap_child_count'],
    is_child: ['is_child'],
    basic_economy_pax: ['basic_economy_pax'],
    is_stroller_user: ['is_stroller_user']
  },
  pnrRemarks: {
    record_locator: ['record_locator', 'pnr_id', 'pnr'],
    pnr_creation_date: ['pnr_creation_date', 'created_date'],
    flight_number: ['flight_number'],
    special_service_request: ['special_service_request', 'ssr', 'remark']
  },
  bags: {
    company_id: ['company_id'],
    flight_number: ['flight_number'],
    scheduled_departure_date_local: ['scheduled_departure_date_local', 'dep_date'],
    scheduled_departure_station_code: ['scheduled_departure_station_code', 'origin'],
    scheduled_arrival_station_code: ['scheduled_arrival_station_code', 'destination'],
    bag_tag_unique_number: ['bag_tag_unique_number', 'bag_tag', 'bag_id'],
    bag_tag_issue_date: ['bag_tag_issue_date', 'issue_date'],
    bag_type: ['bag_type']
  }
};
