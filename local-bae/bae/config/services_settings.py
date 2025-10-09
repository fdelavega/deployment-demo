# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

# Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.

# This file belongs to the business-charging-backend
# of the Business API Ecosystem.

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

VERIFY_REQUESTS = True

SITE = "http://host.docker.internal:8004/"
LOCAL_SITE = "http://host.docker.internal:8006/"

PARTY = "http://host.docker.internal:8633"

CATALOG = "http://host.docker.internal:8632"

#RESOURCE_CATALOG = "http://tmforum-tm-forum-api-resource-catalog:8080"
RESOURCE_CATALOG = "http://host.docker.internal:8636"

#SERVICE_CATALOG = "http://tmforum-tm-forum-api-service-catalog:8080"
SERVICE_CATALOG = "http://host.docker.internal:8637"

INVENTORY = "http://host.docker.internal:8635"
#RESOURCE_INVENTORY = "http://tmforum-tm-forum-api-resource-inventory:8080"
RESOURCE_INVENTORY = "http://host.docker.internal:8641"

SERVICE_INVENTORY = "http://host.docker.internal:8640"

ORDERING = "http://host.docker.internal:8634"

ACCOUNT = "http://host.docker.internal:8639"
BILLING = "http://host.docker.internal:8640"

USAGE = "http://host.docker.internal:8637"
AUTHORIZE_SERVICE = "http://host.docker.internal:8004/authorizeService/apiKeys"

#DOME_BILLING_URL = "http://host.docker.internal:8099"

DOME_BILLING_URL = "http://host.docker.internal:3333"
